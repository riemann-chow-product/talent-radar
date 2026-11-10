package com.talentradar.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentradar.entity.Job;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * 全网公开职位池：由招聘官方公开接口抓取并逐条校验的 JD 快照，
 * 作为智能匹配「捞取市面上最匹配岗位」的数据源，与已采集岗位库相互独立。
 */
@Service
@RequiredArgsConstructor
public class MarketJobService {

    private final ObjectMapper mapper;
    private volatile List<Job> cache;

    public List<Job> jobs() {
        if (cache == null) {
            synchronized (this) {
                if (cache == null) cache = load();
            }
        }
        return cache;
    }

    public int size() { return jobs().size(); }

    /** 多公司覆盖情况：公司数、公司类型分布、各公司岗位数，用于排行榜说明与筛选。 */
    public Map<String, Object> coverage() {
        Map<String, Integer> byType = new TreeMap<>();
        Map<String, Integer> byCompany = new TreeMap<>();
        Map<String, Integer> bySource = new LinkedHashMap<>();
        for (Job j : jobs()) {
            String type = j.getCompanyType() == null || j.getCompanyType().isBlank() ? "其它" : j.getCompanyType();
            String company = normalizeCompany(j.getCompany());
            String source = j.getSource() == null || j.getSource().isBlank() ? "企业官网" : j.getSource();
            byType.merge(type, 1, Integer::sum);
            byCompany.merge(company, 1, Integer::sum);
            bySource.merge(source, 1, Integer::sum);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("companies", byCompany.size());
        out.put("types", byType);
        out.put("byCompany", byCompany);
        out.put("sources", bySource.size());
        out.put("bySource", bySource);
        return out;
    }

    /** 「腾讯·WXG」→「腾讯」，用于公司多样性限额统计。 */
    public static String normalizeCompany(String company) {
        if (company == null || company.isBlank()) return "其它";
        int i = company.indexOf('·');
        return (i > 0 ? company.substring(0, i) : company).trim();
    }

    private List<Job> load() {
        try (InputStream in = new ClassPathResource("seed/market-jobs.json").getInputStream()) {
            List<Map<String, Object>> rows = mapper.readValue(in, new TypeReference<>() {});
            List<Job> out = new ArrayList<>();
            Instant published = Instant.now().minusSeconds(3L * 86400);
            for (Map<String, Object> r : rows) out.add(toJob(r, published));
            return out;
        } catch (Exception e) {
            throw new IllegalStateException("无法读取全网职位池 seed/market-jobs.json", e);
        }
    }

    private static Job toJob(Map<String, Object> r, Instant published) {
        Job j = new Job();
        j.setId(str(r.get("id")));
        j.setTitle(str(r.get("title")));
        j.setCompany(str(r.get("company")));
        j.setCity(str(r.get("city")));
        j.setSalary(str(r.get("salary")));
        j.setMinSalary(num(r.get("minSalary"), 0));
        j.setMaxSalary(num(r.get("maxSalary"), 999));
        j.setHeadcount(num(r.get("headcount"), 1));
        j.setSource(str(r.get("source")));
        j.setSourceName(str(r.get("sourceName")));
        j.setCompanyType(str(r.get("companyType")));
        j.setFundingStage(str(r.get("fundingStage")));
        j.setUrl(str(r.get("url")));
        j.setTags(tags(r.get("tags")));
        j.setMinYears(num(r.get("minYears"), 3));
        j.setMinEdu(str(r.get("minEdu")));
        j.setJd(str(r.get("jd")));
        j.setPublishedAt(published);
        j.setCollectedAt(published);
        return j;
    }

    private static String str(Object o) { return o == null ? "" : String.valueOf(o); }

    private static Integer num(Object o, int fallback) {
        if (o instanceof Number n) return n.intValue();
        try { return o == null ? fallback : Integer.parseInt(String.valueOf(o)); }
        catch (NumberFormatException e) { return fallback; }
    }

    private static List<String> tags(Object o) {
        if (!(o instanceof List<?> list)) return List.of();
        return list.stream().map(String::valueOf).toList();
    }
}
