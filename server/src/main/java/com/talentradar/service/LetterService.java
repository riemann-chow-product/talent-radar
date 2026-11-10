package com.talentradar.service;

import com.talentradar.common.BizException;
import com.talentradar.entity.Candidate;
import com.talentradar.entity.Job;
import com.talentradar.entity.Letter;
import com.talentradar.repo.CandidateRepository;
import com.talentradar.repo.JobRepository;
import com.talentradar.repo.LetterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 推荐语生成。当前为「候选人画像 + JD + 语气模板」的确定性生成，
 * 可通过替换 generate() 的实现接入大模型（读取 company.model / company.temperature）。
 */
@Service
@RequiredArgsConstructor
public class LetterService {

    private final CandidateRepository candidateRepo;
    private final JobRepository jobRepo;
    private final LetterRepository letterRepo;
    private final MatchingService matchingService;
    private final StateService stateService;

    public String subject(Candidate c, Job j, int score) {
        return "【才探 TalentRadar 推荐】" + c.getName() + " · " + j.getTitle() + "｜匹配度 " + score + "%";
    }

    @Transactional(readOnly = true)
    public String generate(String candidateId, String jobId, String tone, Integer variant) {
        Candidate c = candidateRepo.findById(candidateId).orElseThrow(() -> BizException.notFound("候选人"));
        Job j = jobRepo.findById(jobId).orElseThrow(() -> BizException.notFound("岗位"));
        int score = matchingService.score(c, j).score();
        return generate(c, j, score, tone, variant);
    }

    public String generate(Candidate c, Job j, int score, String tone, Integer variant) {
        String t = (tone == null || tone.isBlank()) ? "professional" : tone;
        int v = Math.floorMod(variant == null ? 0 : variant, 3);
        Map<String, Object> co = stateService.getCompany();
        String hrName = str(co.get("hrName")), hrTitle = str(co.get("hrTitle"));
        String hrEmail = str(co.get("hrEmail")), coName = str(co.get("name"));

        List<String> hit = new ArrayList<>();
        List<String> tags = j.getTags() == null ? List.of() : j.getTags();
        List<String> skills = c.getSkills() == null ? List.of() : c.getSkills();
        for (String tag : tags) if (skills.contains(tag)) hit.add(tag);
        String hitText = hit.isEmpty() ? "岗位相关技术栈" : String.join("、", hit.subList(0, Math.min(4, hit.size())));
        String needText = String.join("、", tags.subList(0, Math.min(4, tags.size())));

        String[] openings;
        if ("warm".equals(t)) {
            openings = new String[]{
                    "您好，" + nvl(j.getCompany()) + " 的招聘伙伴：\n\n发现一位和「" + nvl(j.getTitle()) + "」特别合拍的候选人，想第一时间分享给您。",
                    "Hi，" + nvl(j.getCompany()) + " 团队：\n\n刚完成一轮人才筛选，有位候选人和贵司「" + nvl(j.getTitle()) + "」的画像非常贴近，推荐给您看看。"
            };
        } else if ("concise".equals(t)) {
            openings = new String[]{
                    "您好，推荐「" + nvl(j.getTitle()) + "」候选人 " + nvl(c.getName()) + "（匹配度 " + score + "%）。",
                    "贵司「" + nvl(j.getTitle()) + "」岗位匹配到人选：" + nvl(c.getName()) + "，匹配度 " + score + "%。"
            };
        } else {
            openings = new String[]{
                    "尊敬的 " + nvl(j.getCompany()) + " 招聘团队：\n\n您好！基于才探 TalentRadar 的岗位与人才画像比对，谨向贵司推荐一位与「" + nvl(j.getTitle()) + "」高度契合的候选人。",
                    "尊敬的 " + nvl(j.getCompany()) + " 人力资源部：\n\n您好！我们注意到贵司正在招募「" + nvl(j.getTitle()) + "」，经 AI 匹配评估，现向您推荐下列人选。"
            };
        }

        String b0 = "\n\n【候选人】" + nvl(c.getName()) + "｜" + nvl(c.getTitle()) + "｜" + nvl0(c.getYears()) + " 年经验｜"
                + nvl(c.getEducation()) + " · " + nvl(c.getSchool()) + "｜现居 " + nvl(c.getCity())
                + "\n【匹配度】" + score + "%"
                + "\n【核心能力】" + hitText + "，与岗位要求的 " + needText + " 高度重合。"
                + "\n【代表成果】" + nvl(c.getHighlight()) + "。"
                + "\n【推荐理由】" + nvl(matchingService.score(c, j).reason());
        String jd = nvl(j.getJd());
        String b1 = "\n\n" + nvl(c.getName()) + " 现任" + nvl(c.getTitle()) + "，" + nvl0(c.getYears()) + " 年相关经验，毕业于 "
                + nvl(c.getSchool()) + "。其最亮眼的一段经历是：" + nvl(c.getHighlight()) + "。"
                + "\n\n对照贵司 JD 中「" + jd.substring(0, Math.min(42, jd.length())) + "…」的职责描述，候选人在 "
                + hitText + " 上有直接的项目沉淀，预计上手周期较短。"
                + "\n\n候选人当前期望 " + nvl(c.getSalary()) + "，与岗位 " + nvl(j.getSalary()) + " 的区间基本吻合；求职意向为「"
                + nvl(c.getIntent()) + "」，与团队方向一致。";

        String close;
        if ("warm".equals(t)) {
            close = "\n\n如果您对这位候选人感兴趣，回一封邮件或直接告诉我，我马上把完整简历发过来，也可以帮忙约个时间聊一聊。\n\n祝招聘顺利！\n" + hrName + "\n" + hrEmail;
        } else if ("concise".equals(t)) {
            close = "\n\n简历与联系方式见附件，如需安排面试请回复本邮件。\n\n" + hrName + "｜" + hrEmail;
        } else {
            close = "\n\n如贵司认为合适，我们可协助安排初步沟通，并提供完整简历与作品/项目材料。\n\n顺颂商祺\n" + hrName + "｜" + hrTitle + "\n" + coName + "\n" + hrEmail;
        }

        String body = ("concise".equals(t) || v == 0) ? b0 : b1;
        return openings[v % openings.length] + body + close;
    }

    /** 生成并落库一份推荐语草稿 */
    @Transactional
    public Letter generateAndSave(String candidateId, String jobId, String tone, Integer variant) {
        String body = generate(candidateId, jobId, tone, variant);
        Candidate c = candidateRepo.findById(candidateId).orElseThrow(() -> BizException.notFound("候选人"));
        Job j = jobRepo.findById(jobId).orElseThrow(() -> BizException.notFound("岗位"));
        int score = matchingService.score(c, j).score();
        return letterRepo.save(new Letter(stateService.newId("lt"), candidateId, jobId,
                tone == null ? "professional" : tone, subject(c, j, score), body, Instant.now()));
    }

    private static String str(Object o) { return o == null ? "" : String.valueOf(o); }
    private static String nvl(String s) { return s == null ? "" : s; }
    private static String nvl0(Integer n) { return n == null ? "0" : String.valueOf(n); }
}
