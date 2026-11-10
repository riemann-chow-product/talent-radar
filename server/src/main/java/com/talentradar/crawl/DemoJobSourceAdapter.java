package com.talentradar.crawl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentradar.entity.Job;
import com.talentradar.entity.Source;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 演示采集适配器：不访问任何外部站点，从构建时抓取并校验过的「真实公开 JD 池」产出岗位。
 *
 * <p>池内每条岗位都带有可打开的真实职位详情链接（腾讯招聘公开职位接口抓取）。
 * 默认模式：运行时无需联网，也不会生成 example.com 之类的虚构链接。</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DemoJobSourceAdapter implements JobSourceAdapter {

    private static final String POOL_RESOURCE = "seed/real-jobs.json";

    private final ObjectMapper mapper;
    private volatile List<Map<String, Object>> pool;

    @Override
    public String mode() { return "demo"; }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> pool() {
        if (pool == null) {
            synchronized (this) {
                if (pool == null) {
                    try (InputStream in = new ClassPathResource(POOL_RESOURCE).getInputStream()) {
                        pool = mapper.readValue(in, new TypeReference<List<Map<String, Object>>>() {});
                    } catch (Exception e) {
                        log.warn("真实 JD 池加载失败，演示采集将不产出岗位: {}", e.getMessage());
                        pool = List.of();
                    }
                }
            }
        }
        return pool;
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Job> fetch(Source source, int max) {
        List<Map<String, Object>> data = pool();
        if (data.isEmpty()) return List.of();

        int seed = Math.abs((source == null ? "all" : source.getId()).hashCode());
        List<Job> out = new ArrayList<>();
        Instant now = Instant.now();
        for (int i = 0; i < Math.min(max, 3); i++) {
            Map<String, Object> m = data.get((seed + i * 7) % data.size());
            String url = str(m.get("url"));
            if (!isHttp(url)) continue; // 绝不写入无效链接
            Job job = new Job();
            job.setTitle(str(m.get("title")));
            job.setCompany(str(m.get("company")));
            job.setCity(str(m.get("city")));
            job.setSalary(str(m.get("salary")));
            job.setMinSalary(intOf(m.get("minSalary")));
            job.setMaxSalary(intOf(m.get("maxSalary")));
            job.setHeadcount(intOf(m.get("headcount")));
            job.setSource(str(m.get("source")));
            job.setSourceName(str(m.get("sourceName")));
            job.setCompanyType(str(m.get("companyType")));
            job.setFundingStage(str(m.get("fundingStage")));
            job.setUrl(url);
            job.setTags(m.get("tags") instanceof List<?> t ? t.stream().map(String::valueOf).toList() : List.of("公开职位"));
            job.setMinYears(intOf(m.get("minYears")));
            job.setMinEdu(str(m.get("minEdu")));
            job.setJd(str(m.get("jd")));
            job.setPublishedAt(now.minus(2L + i, ChronoUnit.HOURS));
            job.setCollectedAt(now);
            out.add(job);
        }
        return out;
    }

    private static boolean isHttp(String s) {
        return s != null && (s.startsWith("https://") || s.startsWith("http://"));
    }

    private static String str(Object o) { return o == null ? "" : String.valueOf(o); }

    private static Integer intOf(Object o) {
        if (o instanceof Number n) return n.intValue();
        try { return Integer.parseInt(str(o)); } catch (Exception e) { return 0; }
    }
}
