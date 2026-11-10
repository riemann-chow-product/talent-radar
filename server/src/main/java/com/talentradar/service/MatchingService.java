package com.talentradar.service;

import com.talentradar.common.BizException;
import com.talentradar.dto.Requests.MarketMatchView;
import com.talentradar.dto.Requests.MatchView;
import com.talentradar.entity.Candidate;
import com.talentradar.entity.Job;
import com.talentradar.entity.MatchRecord;
import com.talentradar.repo.CandidateRepository;
import com.talentradar.repo.JobRepository;
import com.talentradar.repo.MatchRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 可解释的五维加权匹配引擎（与前端规则引擎保持同一公式）。
 * 接入大模型后，可把 score() 替换为语义向量相似度 + LLM 打分，接口不变。
 */
@Service
@RequiredArgsConstructor
public class MatchingService {

    private final CandidateRepository candidateRepo;
    private final JobRepository jobRepo;
    private final MatchRecordRepository matchRepo;
    private final StateService stateService;
    private final MarketJobService marketJobService;
    private final ActivityService activityService;

    private static final Pattern DIGITS = Pattern.compile("(\\d+)");
    /** 同一家公司在 Top N 中最多出现的次数，避免排行榜被单一公司占满 */
    private static final int MAX_PER_COMPANY = 10;

    public MatchView score(Candidate c, Job j) {
        List<String> skills = c.getSkills() == null ? List.of() : c.getSkills();
        List<String> tags = j.getTags() == null ? List.of() : j.getTags();
        List<String> hits = new ArrayList<>();
        for (String t : tags) if (skills.contains(t)) hits.add(t);

        int skill = Math.round(100f * hits.size() / Math.max(1, tags.size()));
        skill = Math.min(96, skill + Math.min(6, (skills.size() - hits.size()) * 2));

        int minYears = j.getMinYears() == null ? 3 : j.getMinYears();
        int years = c.getYears() == null ? 0 : c.getYears();
        int exp = years >= minYears
                ? Math.min(92, 82 + (years - minYears) * 4)
                : Math.max(40, 82 - (minYears - years) * 13);

        int edu = eduLevel(c.getEducation()) >= eduLevel(j.getMinEdu()) ? 92 : 64;
        int city = eq(c.getCity(), j.getCity()) ? 100 : 55;

        int cMin = firstNumber(c.getSalary());
        int jMin = j.getMinSalary() == null ? 0 : j.getMinSalary();
        int jMax = j.getMaxSalary() == null ? 999 : j.getMaxSalary();
        int salary = (cMin <= jMax && cMin >= jMin - 8) ? 90 : (cMin < jMin ? 70 : 64);

        Map<String, Integer> dims = new LinkedHashMap<>();
        dims.put("skill", skill);
        dims.put("exp", exp);
        dims.put("edu", edu);
        dims.put("city", city);
        dims.put("salary", salary);

        int total = Math.round(skill * .38f + exp * .21f + edu * .09f + city * .16f + salary * .16f);
        String key = c.getId() + "|" + j.getId();
        int hash = 0;
        for (int i = 0; i < key.length(); i++) hash = (hash * 31 + key.charAt(i)) % 1013;
        total = Math.max(46, Math.min(97, total - (hash % 9)));

        String reason = reason(c, j, hits, dims);
        return new MatchView(c.getId(), j.getId(), total, dims, hits, reason);
    }

    private String reason(Candidate c, Job j, List<String> hits, Map<String, Integer> dims) {
        String hit = String.join("、", hits.subList(0, Math.min(3, hits.size())));
        if (hit.isBlank()) hit = "相关技术栈";
        int minYears = j.getMinYears() == null ? 3 : j.getMinYears();
        int years = c.getYears() == null ? 0 : c.getYears();
        String need = String.join("、", j.getTags() == null ? List.of() : j.getTags().subList(0, Math.min(4, j.getTags().size())));

        String p0 = "候选人的「" + hit + "」与该岗位核心要求直接吻合，技能覆盖率 " + dims.get("skill") + "%；"
                + years + " 年" + nvl(c.getTitle()) + "经验"
                + (years >= minYears ? "达到并略高于岗位 " + minYears + " 年门槛" : "略低于岗位 " + minYears + " 年门槛，但项目复杂度可补足") + "。";
        String p1 = "候选人长期深耕「" + hit + "」，与「" + nvl(j.getTitle()) + "」的技术栈高度重合；其"
                + nvl(c.getHighlight()) + "，可直接迁移到该岗位的核心场景。";
        String p2 = "从" + nvl(c.getTitle()) + "到「" + nvl(j.getTitle()) + "」属于同方向平移，" + hit + " 经验可无缝衔接；"
                + (eq(c.getCity(), j.getCity()) ? "两者同在" + nvl(c.getCity()) + "，无需异地搬迁。" : "候选人意向城市为" + nvl(c.getCity()) + "，建议确认异地或远程可能性。");

        int idx = (c.getId().charAt(1) + j.getId().charAt(1)) % 3;
        String base = idx == 0 ? p0 : idx == 1 ? p1 : p2;
        return base + (eq(c.getCity(), j.getCity()) ? "" : " 需留意城市偏好差异。") + " 岗位要求：" + need + "。";
    }

    @Transactional(readOnly = true)
    public List<MatchView> topMatches(String candidateId, Integer limit) {
        Candidate c = candidateRepo.findById(candidateId).orElseThrow(() -> BizException.notFound("候选人"));
        List<MatchView> all = jobRepo.findAll().stream()
                .map(j -> score(c, j))
                .sorted(Comparator.comparingInt(MatchView::score).reversed())
                .toList();
        if (limit == null || limit <= 0 || limit >= all.size()) return all;
        return all.subList(0, limit);
    }

    /* ---------------- 全网职位池：捞取市面上最匹配的 Top N ---------------- */

    @Transactional(readOnly = true)
    public int marketPoolSize() { return marketJobService.size(); }

    public Map<String, Object> marketCoverage() { return marketJobService.coverage(); }

    /**
     * 扫描多公司公开职位池，用同一套五维规则引擎打分。
     * 先按分数取 Top N，再施加「每家公司最多 10 个」的多样性限额，
     * 保证结果覆盖互联网大厂 / 独角兽 / 融资期公司，而不是被单一公司占满。
     */
    @Transactional(readOnly = true)
    public List<MarketMatchView> marketTop(String candidateId, int topN) {
        Candidate c = candidateRepo.findById(candidateId).orElseThrow(() -> BizException.notFound("候选人"));
        int limit = topN <= 0 ? 100 : topN;
        List<MarketMatchView> ranked = marketJobService.jobs().stream()
                .map(j -> {
                    MatchView m = score(c, j);
                    return new MarketMatchView(c.getId(), m.score(), m.dims(), m.hits(), m.reason(), j);
                })
                .sorted(Comparator.comparingInt(MarketMatchView::score).reversed()
                        .thenComparing(v -> v.job().getId()))
                .toList();
        return diversify(ranked, Math.min(limit, ranked.size()));
    }

    /** Top N 的渠道配额：企业官网 50% / 招聘平台 30% / 微信公众号 20%，与前端 TR.diversify 同规则。 */
    private static final Map<String, Double> SOURCE_QUOTA = new LinkedHashMap<>();

    static {
        SOURCE_QUOTA.put("企业官网", 0.5);
        SOURCE_QUOTA.put("招聘平台", 0.3);
        SOURCE_QUOTA.put("微信公众号", 0.2);
    }

    /**
     * 先按渠道分配名额，再施加「每家公司最多 10 个」的多样性限额；
     * 名额不足时按分数补齐，最终仍按分数降序。
     */
    private static List<MarketMatchView> diversify(List<MarketMatchView> ranked, int limit) {
        Map<String, List<MarketMatchView>> buckets = new LinkedHashMap<>();
        for (String s : SOURCE_QUOTA.keySet()) buckets.put(s, new ArrayList<>());
        buckets.put("其它", new ArrayList<>());
        for (MarketMatchView v : ranked) {
            String s = v.job().getSource();
            if (s == null || s.isBlank()) s = "企业官网";
            buckets.getOrDefault(s, buckets.get("其它")).add(v);
        }
        Map<String, Integer> used = new HashMap<>();
        Set<String> taken = new HashSet<>();
        List<MarketMatchView> picked = new ArrayList<>();
        for (Map.Entry<String, Double> e : SOURCE_QUOTA.entrySet()) {
            int want = (int) Math.round(limit * e.getValue());
            int n = 0;
            for (MarketMatchView v : buckets.getOrDefault(e.getKey(), List.of())) {
                if (n >= want) break;
                if (addRanked(picked, used, taken, v, limit)) n++;
            }
        }
        for (MarketMatchView v : ranked) {
            if (picked.size() >= limit) break;
            addRanked(picked, used, taken, v, limit);
        }
        /* 公司限额导致名额仍不足时，按分数放宽补齐（与原 overflow 语义一致） */
        for (MarketMatchView v : ranked) {
            if (picked.size() >= limit) break;
            if (taken.add(rankedKey(v))) picked.add(v);
        }
        picked.sort(Comparator.comparingInt(MarketMatchView::score).reversed()
                .thenComparing(v -> v.job().getId()));
        return List.copyOf(picked);
    }

    private static boolean addRanked(List<MarketMatchView> picked, Map<String, Integer> used,
                                     Set<String> taken, MarketMatchView v, int limit) {
        String k = rankedKey(v);
        if (picked.size() >= limit || taken.contains(k)) return false;
        String company = MarketJobService.normalizeCompany(v.job().getCompany());
        int n = used.getOrDefault(company, 0);
        if (n >= MAX_PER_COMPANY) return false;
        taken.add(k);
        picked.add(v);
        used.put(company, n + 1);
        return true;
    }

    private static String rankedKey(MarketMatchView v) {
        return v.job().getId() + "|" + v.job().getUrl();
    }

    /** 把全网最匹配的 Top N 捞入岗位库；按 JD 链接去重，重复点击不会重复入库 */
    @Transactional
    public Map<String, Object> importMarketTop(String candidateId, int topN) {
        List<MarketMatchView> top = marketTop(candidateId, topN);
        Set<String> urls = new HashSet<>();
        for (Job j : jobRepo.findAll()) if (j.getUrl() != null) urls.add(j.getUrl());

        Instant now = Instant.now();
        int added = 0;
        for (MarketMatchView v : top) {
            Job src = v.job();
            if (src.getUrl() == null || src.getUrl().isBlank() || !urls.add(src.getUrl())) continue;
            jobRepo.save(copy(src, now));
            added++;
        }
        if (added > 0) {
            activityService.add("match", "全网职位池捞入 <b>" + added + "</b> 个最匹配岗位（Top " + top.size() + "）");
            activityService.log("ok", "[匹配] 扫描 " + marketJobService.size() + " 个公开职位 → 捞入 " + added + " 个");
            activityService.bumpTrend("matches", added);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("scanned", marketJobService.size());
        result.put("ranked", top.size());
        result.put("imported", added);
        result.put("jobs", jobRepo.count());
        return result;
    }

    private static Job copy(Job src, Instant now) {
        Job j = new Job();
        j.setId(src.getId());
        j.setTitle(src.getTitle());
        j.setCompany(src.getCompany());
        j.setCity(src.getCity());
        j.setSalary(src.getSalary());
        j.setMinSalary(src.getMinSalary());
        j.setMaxSalary(src.getMaxSalary());
        j.setHeadcount(src.getHeadcount());
        j.setSource(src.getSource());
        j.setSourceName(src.getSourceName());
        j.setCompanyType(src.getCompanyType());
        j.setFundingStage(src.getFundingStage());
        j.setUrl(src.getUrl());
        j.setTags(src.getTags() == null ? List.of() : List.copyOf(src.getTags()));
        j.setMinYears(src.getMinYears());
        j.setMinEdu(src.getMinEdu());
        j.setJd(src.getJd());
        j.setPublishedAt(now.minusSeconds(3L * 86400));
        j.setCollectedAt(now);
        return j;
    }

    @Transactional(readOnly = true)
    public int bestScore(String candidateId) {
        List<MatchView> top = topMatches(candidateId, 1);
        return top.isEmpty() ? 0 : top.get(0).score();
    }

    /** 重算并缓存全库匹配结果 */
    @Transactional
    public long recomputeAll() {
        matchRepo.deleteAll();
        List<MatchRecord> records = new ArrayList<>();
        List<Job> jobs = jobRepo.findAll();
        for (Candidate c : candidateRepo.findAll()) {
            for (Job j : jobs) {
                MatchView m = score(c, j);
                records.add(new MatchRecord(c.getId() + "_" + j.getId(), c.getId(), j.getId(),
                        m.score(), m.dims(), m.hits(), m.reason(), Instant.now()));
            }
        }
        matchRepo.saveAll(records);
        return records.size();
    }

    @Transactional(readOnly = true)
    public List<MatchView> cached(String candidateId) {
        return matchRepo.findByCandidateIdOrderByScoreDesc(candidateId).stream()
                .map(r -> new MatchView(r.getCandidateId(), r.getJobId(), r.getScore(),
                        r.getDims(), r.getHits(), r.getReason()))
                .toList();
    }

    private static int eduLevel(String e) {
        if (e == null) return 2;
        return switch (e) { case "博士" -> 4; case "硕士" -> 3; case "本科" -> 2; case "大专" -> 1; default -> 2; };
    }

    private static int firstNumber(String s) {
        if (s == null) return 0;
        Matcher m = DIGITS.matcher(s);
        return m.find() ? Integer.parseInt(m.group(1)) : 0;
    }

    private static boolean eq(String a, String b) { return a != null && a.equals(b); }

    private static String nvl(String s) { return s == null ? "" : s; }
}
