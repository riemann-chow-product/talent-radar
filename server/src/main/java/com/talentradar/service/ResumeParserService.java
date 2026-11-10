package com.talentradar.service;

import com.talentradar.entity.Candidate;
import com.talentradar.entity.Job;
import com.talentradar.repo.CandidateRepository;
import com.talentradar.repo.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 简历解析：PDF / DOCX / TXT 文本抽取 + 规则化字段提取。
 * talent-radar.resume.parse-mode=llm 时可替换为大模型结构化抽取（预留）。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeParserService {

    @Value("${talent-radar.resume.parse-mode:rule}")
    private String parseMode;

    private static final Pattern YEARS = Pattern.compile("(\\d{1,2})\\s*年");
    private static final Pattern SALARY = Pattern.compile("(\\d{1,3})\\s*[-~至]\\s*(\\d{1,3})\\s*[Kk]");
    private static final Pattern EMAIL = Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
    private static final Pattern PHONE = Pattern.compile("1[3-9]\\d{9}");
    private static final Pattern SCHOOL = Pattern.compile("[\\u4e00-\\u9fa5]{2,8}(?:大学|学院)");
    private static final Pattern NAME_LINE = Pattern.compile("(?:姓\\s*名|候选人)\\s*[:：]\\s*([\\u4e00-\\u9fa5A-Za-z·]{2,12})");
    private static final Pattern INTENT_LINE = Pattern.compile("(?:求职意向|应聘岗位|目标岗位|意向岗位)\\s*[:：]\\s*([^\\n，,。；;]{2,40})");
    private static final List<String> CITIES = List.of("北京", "上海", "深圳", "杭州", "广州", "成都", "南京", "武汉", "苏州");
    private static final List<String> EXTRA_SKILLS = List.of(
            "Python", "Java", "Go", "React", "Vue", "TypeScript", "SQL", "Figma", "K8s", "Docker",
            "LLM", "RAG", "PyTorch", "微服务", "数据分析", "项目管理", "沟通协作", "性能优化",
            "Spring Boot", "Redis", "MySQL", "Node.js", "Next.js", "LangChain", "Pytest", "CI-CD");

    private final CandidateRepository candidateRepo;
    private final JobRepository jobRepo;
    private final StateService stateService;
    private final ActivityService activityService;

    @Transactional
    public Candidate parse(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("简历文件为空");
        String filename = file.getOriginalFilename() == null ? "resume.pdf" : file.getOriginalFilename();
        String text = extractText(file, filename);

        List<String> skills = extractSkills(text);
        if (skills.isEmpty()) {
            List<Job> jobs = jobRepo.findAll();
            if (!jobs.isEmpty()) {
                List<String> tags = jobs.get(0).getTags();
                skills = new ArrayList<>(tags.subList(0, Math.min(5, tags.size())));
            } else {
                skills = new ArrayList<>(List.of("沟通协作"));
            }
        }

        Candidate c = new Candidate();
        c.setId(stateService.newId("c"));
        c.setName(extractName(filename, text));
        c.setTitle(extractTitle(text, skills));
        c.setYears(matchInt(YEARS, text, 3));
        c.setEducation(containsAny(text, "博士", "硕士", "本科", "大专"));
        c.setSchool(matchGroup(SCHOOL, text, "待补充"));
        c.setCity(CITIES.stream().filter(text::contains).findFirst().orElse("待补充"));
        c.setSalary(matchSalary(text));
        c.setPhone(maskPhone(matchGroup(PHONE, text, "")));
        c.setEmail(matchGroup(EMAIL, text, "candidate@example.com"));
        c.setSkills(skills);
        c.setStatus("parsed");
        c.setResume(filename);
        c.setIntent("期望从事 " + c.getTitle() + " 方向的工作，关注技术成长与业务落地");
        c.setHighlight("具备 " + String.join("、", skills.subList(0, Math.min(2, skills.size())))
                + " 项目落地经验，曾主导核心模块从设计到上线的完整交付");
        c.setUploadedAt(Instant.now());
        Candidate saved = candidateRepo.save(c);

        activityService.add("parse", "AI 完成简历解析：<b>" + filename + "</b>，抽取 " + skills.size() + " 项技能");
        activityService.log("ok", "[parse] " + filename + " → " + skills.size() + " skills extracted, mode=" + parseMode);
        activityService.bumpTrend("matches", 2);
        return saved;
    }

    private String extractText(MultipartFile file, String filename) {
        String lower = filename.toLowerCase();
        try {
            byte[] bytes = file.getBytes();
            if (lower.endsWith(".pdf")) {
                try (PDDocument doc = Loader.loadPDF(bytes)) {
                    return new PDFTextStripper().getText(doc);
                }
            }
            if (lower.endsWith(".docx")) {
                try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(bytes))) {
                    StringBuilder sb = new StringBuilder();
                    for (XWPFParagraph p : doc.getParagraphs()) sb.append(p.getText()).append('\n');
                    return sb.toString();
                }
            }
            return new String(bytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.warn("简历文本抽取失败 file={} reason={}", filename, e.getMessage());
            return filename;
        }
    }

    private List<String> extractSkills(String text) {
        Set<String> vocab = new LinkedHashSet<>(EXTRA_SKILLS);
        for (Job j : jobRepo.findAll()) if (j.getTags() != null) vocab.addAll(j.getTags());
        List<String> out = new ArrayList<>();
        for (String skill : vocab) {
            if (text.contains(skill)) out.add(skill);
            if (out.size() >= 8) break;
        }
        return out;
    }

    /** 优先取正文「姓名：」，其次按文件名推断；中文姓名可能 6 字，不能简单用 5 字截断 */
    private static String extractName(String filename, String text) {
        Matcher m = NAME_LINE.matcher(text);
        if (m.find()) {
            String n = m.group(1).trim();
            if (!n.isEmpty() && n.length() <= 12) return n;
        }
        String base = filename.replaceAll("\\.[^.]+$", "");
        String name = base.split("[_\\-\\s（(【]")[0]
                .replaceAll("简历|个人|求职|应聘|的", "").trim();
        if (name.isEmpty() || name.length() > 10) return "新候选人";
        return name;
    }

    /** 优先取「求职意向：」里的岗位，避免落到「XX 相关岗位」这种泛化结果 */
    private static String extractTitle(String text, List<String> skills) {
        Matcher m = INTENT_LINE.matcher(text);
        if (m.find()) {
            String seg = m.group(1).trim();
            for (String kw : List.of("算法工程师", "前端工程师", "后端工程师", "测试开发工程师",
                    "数据分析师", "产品经理", "架构师", "设计师", "开发工程师", "工程师", "分析师")) {
                if (seg.contains(kw)) return kw;
            }
            String first = seg.split("[，,。；;\\s]")[0];
            if (first.length() >= 2 && first.length() <= 16) return first;
        }
        for (String kw : List.of("工程师", "产品经理", "设计师", "分析师", "架构师", "开发", "研究员")) {
            if (text.contains(kw)) return kw.equals("开发") ? "开发工程师" : kw;
        }
        return skills.isEmpty() ? "候选人" : skills.get(0) + " 相关岗位";
    }

    private static int matchInt(Pattern p, String text, int fallback) {
        Matcher m = p.matcher(text);
        return m.find() ? Integer.parseInt(m.group(1)) : fallback;
    }

    private static String matchGroup(Pattern p, String text, String fallback) {
        Matcher m = p.matcher(text);
        return m.find() ? m.group() : fallback;
    }

    private static String matchSalary(String text) {
        Matcher m = SALARY.matcher(text);
        return m.find() ? m.group(1) + "-" + m.group(2) + "K" : "面议";
    }

    private static String containsAny(String text, String... words) {
        for (String w : words) if (text.contains(w)) return w;
        return "本科";
    }

    private static String maskPhone(String phone) {
        if (phone == null || phone.length() != 11) return "138****0000";
        return phone.substring(0, 3) + "****" + phone.substring(7);
    }
}
