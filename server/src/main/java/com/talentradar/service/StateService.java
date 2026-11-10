package com.talentradar.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentradar.entity.Activity;
import com.talentradar.entity.Candidate;
import com.talentradar.entity.CollectLog;
import com.talentradar.entity.Job;
import com.talentradar.entity.Letter;
import com.talentradar.entity.MailRecord;
import com.talentradar.entity.Setting;
import com.talentradar.entity.Source;
import com.talentradar.entity.TrendPoint;
import com.talentradar.repo.ActivityRepository;
import com.talentradar.repo.CandidateRepository;
import com.talentradar.repo.CollectLogRepository;
import com.talentradar.repo.JobRepository;
import com.talentradar.repo.LetterRepository;
import com.talentradar.repo.MailRecordRepository;
import com.talentradar.repo.SettingRepository;
import com.talentradar.repo.SourceRepository;
import com.talentradar.repo.TrendPointRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 平台状态服务。
 *
 * <p>GET /api/bootstrap 返回与前端 Store.state 完全同构的快照，便于前端一次性加载；
 * PUT /api/state 是原型阶段的桥接接口，把前端全量快照事务性写回 MySQL。
 * 生产环境若有多端并发写入，建议改用下方各 Controller 的细粒度 REST 接口。</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StateService {

    private final ObjectMapper mapper;
    private final CandidateRepository candidateRepo;
    private final JobRepository jobRepo;
    private final SourceRepository sourceRepo;
    private final MailRecordRepository mailRepo;
    private final LetterRepository letterRepo;
    private final ActivityRepository activityRepo;
    private final CollectLogRepository logRepo;
    private final TrendPointRepository trendRepo;
    private final SettingRepository settingRepo;

    private static final String COMPANY_KEY = "company";
    private static final String SEQ_KEY = "seq";

    /** 前端 state 的完整快照 */
    @Transactional(readOnly = true)
    public Map<String, Object> bootstrap() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("version", 1);
        m.put("company", getCompany());
        m.put("candidates", candidateRepo.findAllByOrderByUploadedAtDesc());
        m.put("jobs", jobRepo.findAllByOrderByCollectedAtDesc());
        m.put("sources", sourceRepo.findAllByOrderByIdAsc());
        m.put("mails", mailRepo.findAllByOrderBySentAtDesc());
        m.put("letters", letterRepo.findAllByOrderByCreatedAtDesc());
        m.put("activities", activityRepo.findTop40ByOrderByTimeDesc());
        m.put("trend", trendRepo.findAllByOrderBySortOrderAsc());
        m.put("logs", logRepo.findTop30ByOrderByTimeDesc());
        m.put("seq", getSeq());
        return m;
    }

    /** 事务性全量替换各业务集合；返回替换后的最新快照 */
    @Transactional
    public Map<String, Object> replaceAll(Map<String, Object> snap) {
        if (snap == null) throw new IllegalArgumentException("请求体不能为空");

        List<Candidate> candidates = ensureIds(list(snap.get("candidates"), Candidate.class), "c", Candidate::getId, Candidate::setId);
        List<Job> jobs = ensureIds(list(snap.get("jobs"), Job.class), "j", Job::getId, Job::setId);
        List<Source> sources = ensureIds(list(snap.get("sources"), Source.class), "s", Source::getId, Source::setId);
        List<MailRecord> mails = ensureIds(list(snap.get("mails"), MailRecord.class), "m", MailRecord::getId, MailRecord::setId);
        List<Letter> letters = ensureIds(list(snap.get("letters"), Letter.class), "l", Letter::getId, Letter::setId);
        List<Activity> activities = ensureIds(list(snap.get("activities"), Activity.class), "a", Activity::getId, Activity::setId);

        candidateRepo.deleteAll();   candidateRepo.saveAll(candidates);
        jobRepo.deleteAll();         jobRepo.saveAll(jobs);
        sourceRepo.deleteAll();      sourceRepo.saveAll(sources);
        mailRepo.deleteAll();        mailRepo.saveAll(mails);
        letterRepo.deleteAll();      letterRepo.saveAll(letters);
        activityRepo.deleteAll();    activityRepo.saveAll(activities);
        logRepo.deleteAll();         logRepo.saveAll(logs(snap.get("logs")));
        trendRepo.deleteAll();       trendRepo.saveAll(trends(snap.get("trend")));

        if (snap.get("company") instanceof Map<?, ?> company) {
            putCompany(company);
        }
        if (snap.get("seq") != null) {
            putSeq(num(snap.get("seq"), 100));
        }
        return bootstrap();
    }

    @Transactional
    public Map<String, Object> reset() {
        return replaceAll(loadSeed());
    }

    /** 从 classpath 读取与前端一致的演示种子数据 */
    public Map<String, Object> loadSeed() {
        try {
            return mapper.readValue(new ClassPathResource("seed/state.json").getInputStream(),
                    new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new IllegalStateException("无法读取 seed/state.json", e);
        }
    }

    /* ---------------- 设置 ---------------- */

    @Transactional(readOnly = true)
    public Map<String, Object> getCompany() {
        return settingRepo.findById(COMPANY_KEY)
                .map(s -> {
                    try {
                        return mapper.readValue(s.getValue(), new TypeReference<Map<String, Object>>() {});
                    } catch (Exception e) {
                        throw new IllegalStateException("company 配置损坏", e);
                    }
                })
                .orElseGet(() -> {
                    Object seedCompany = loadSeed().get("company");
                    return mapper.convertValue(seedCompany, new TypeReference<Map<String, Object>>() {});
                });
    }

    @Transactional
    public Map<String, Object> putCompany(Map<?, ?> company) {
        try {
            settingRepo.save(new Setting(COMPANY_KEY, mapper.writeValueAsString(company)));
        } catch (Exception e) {
            throw new IllegalArgumentException("company 配置无法序列化", e);
        }
        return mapper.convertValue(company, new TypeReference<Map<String, Object>>() {});
    }

    /* ---------------- 序列 ---------------- */

    @Transactional(readOnly = true)
    public int getSeq() {
        return settingRepo.findById(SEQ_KEY)
                .map(s -> {
                    try { return Integer.parseInt(s.getValue()); }
                    catch (NumberFormatException e) { return 100; }
                })
                .orElse(100);
    }

    @Transactional
    public int nextSeq() {
        int n = getSeq() + 1;
        putSeq(n);
        return n;
    }

    private void putSeq(int n) {
        settingRepo.save(new Setting(SEQ_KEY, String.valueOf(n)));
    }

    @Transactional
    public String newId(String prefix) {
        return prefix + nextSeq();
    }

    /* ---------------- 内部工具 ---------------- */

    private <T> List<T> list(Object raw, Class<T> clazz) {
        if (raw == null) return new ArrayList<>();
        return new ArrayList<>(mapper.convertValue(raw,
                mapper.getTypeFactory().constructCollectionType(List.class, clazz)));
    }

    private <T> List<T> ensureIds(List<T> items, String prefix,
                                  java.util.function.Function<T, String> getter,
                                  java.util.function.BiConsumer<T, String> setter) {
        int base = getSeq();
        for (int i = 0; i < items.size(); i++) {
            if (getter.apply(items.get(i)) == null || getter.apply(items.get(i)).isBlank()) {
                setter.accept(items.get(i), prefix + (++base));
            }
        }
        return items;
    }

    private List<TrendPoint> trends(Object raw) {
        List<Map<String, Object>> items = raw == null ? List.of()
                : mapper.convertValue(raw, new TypeReference<List<Map<String, Object>>>() {});
        List<TrendPoint> out = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            Map<String, Object> it = items.get(i);
            out.add(new TrendPoint("t" + i, str(it.get("date")),
                    num(it.get("matches"), 0), num(it.get("pushes"), 0), i));
        }
        return out;
    }

    private List<CollectLog> logs(Object raw) {
        List<Map<String, Object>> items = raw == null ? List.of()
                : mapper.convertValue(raw, new TypeReference<List<Map<String, Object>>>() {});
        List<CollectLog> out = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            Map<String, Object> it = items.get(i);
            out.add(new CollectLog("log" + i, instant(it.get("time")),
                    str(it.get("level")), str(it.get("text"))));
        }
        return out;
    }

    private static String str(Object o) { return o == null ? "" : String.valueOf(o); }

    private static int num(Object o, int fallback) {
        if (o instanceof Number n) return n.intValue();
        if (o instanceof String s) {
            try { return Integer.parseInt(s.trim()); } catch (NumberFormatException ignored) { }
        }
        return fallback;
    }

    private static Instant instant(Object o) {
        if (o instanceof Number n) return Instant.ofEpochMilli(n.longValue());
        if (o instanceof String s && !s.isBlank()) {
            try { return Instant.parse(s); } catch (Exception ignored) { }
        }
        return Instant.now();
    }
}
