package com.talentradar.crawl;

import com.talentradar.entity.Job;
import com.talentradar.entity.Source;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * 官网招聘页适配器（需显式设置 talent-radar.crawl.mode=web）。
 *
 * <p>只抓取用户在数据源中自行配置的「企业官网」URL，使用正常 User-Agent、遵守超时限制，
 * 不做登录绕过、验证码绕过或反爬对抗。岗位的原始链接取自页面上真实存在的职位详情
 * {@code <a href>}，绝不拼接虚构 URL；抓不到真实链接时不产出岗位。</p>
 */
@Slf4j
@Component
public class WebPageJobSourceAdapter implements JobSourceAdapter {

    private static final String[] TITLE_KEYWORDS = {"工程师", "经理", "设计师", "架构师", "分析师", "开发", "招聘", "实习", "专家"};
    private static final String[] LINK_KEYWORDS = {"job", "position", "detail", "career", "recruit", "zhaopin", "postid", "vacancy", "opening"};
    private static final String[] ATS_HOSTS = {"greenhouse.io", "lever.co", "workday", "myworkdayjobs", "ashbyhq.com", "jobs.", "careers."};

    @Value("${talent-radar.crawl.user-agent:TalentRadarBot/0.1}")
    private String userAgent;

    @Value("${talent-radar.crawl.timeout-ms:8000}")
    private int timeoutMs;

    @Override
    public String mode() { return "web"; }

    @Override
    public List<Job> fetch(Source source, int max) {
        if (source == null || !"企业官网".equals(source.getType())) return List.of();
        String url = source.getUrl();
        if (!isHttp(url)) return List.of();

        try {
            Document doc = Jsoup.connect(url)
                    .userAgent(userAgent)
                    .timeout(timeoutMs)
                    .followRedirects(true)
                    .get();

            Map<String, String> links = new LinkedHashMap<>();
            for (Element a : doc.select("a[href]")) {
                String text = a.text().trim().replaceAll("\\s+", " ");
                if (text.length() < 4 || text.length() > 40 || !isJobTitle(text)) continue;
                String href = absolute(url, a.attr("href"));
                if (!isRealJobLink(url, href)) continue;
                links.putIfAbsent(text, href);
                if (links.size() >= max) break;
            }

            if (links.isEmpty()) {
                log.info("官网 {} 未发现可用的真实 JD 详情链接，本轮不产出岗位", url);
                return List.of();
            }

            List<Job> out = new ArrayList<>();
            Instant now = Instant.now();
            for (Map.Entry<String, String> e : links.entrySet()) {
                Job job = new Job();
                job.setTitle(e.getKey());
                job.setCompany(source.getName());
                job.setCity("面议");
                job.setSalary("面议");
                job.setMinSalary(0);
                job.setMaxSalary(0);
                job.setHeadcount(1);
                job.setSource("企业官网");
                job.setSourceName(source.getName());
                job.setUrl(e.getValue());
                job.setTags(List.of("官网公开职位"));
                job.setMinYears(0);
                job.setMinEdu("不限");
                job.setJd("来自 " + source.getName() + " 招聘页：" + e.getKey() + "。详情请查看原始链接。");
                job.setPublishedAt(now);
                job.setCollectedAt(now);
                out.add(job);
            }
            return out;
        } catch (Exception e) {
            log.warn("官网采集失败 source={} url={} reason={}", source.getName(), url, e.getMessage());
            return List.of();
        }
    }

    private static boolean isJobTitle(String text) {
        for (String kw : TITLE_KEYWORDS) if (text.contains(kw)) return true;
        return false;
    }

    private static boolean isHttp(String s) {
        return s != null && (s.startsWith("https://") || s.startsWith("http://"));
    }

    /** 把页面里的相对链接解析成可点击的绝对 URL */
    private static String absolute(String base, String href) {
        if (href == null || href.isBlank()) return "";
        String h = href.trim();
        if (isHttp(h)) return h;
        if (h.startsWith("//")) return "https:" + h;
        try { return URI.create(base).resolve(h).toString(); }
        catch (Exception e) { return ""; }
    }

    /** 只接受同域或常见 ATS 域名、且路径含职位语义的链接 */
    private static boolean isRealJobLink(String base, String link) {
        if (!isHttp(link)) return false;
        String low = link.toLowerCase(Locale.ROOT);
        if (low.contains("javascript:") || low.contains("mailto:") || low.endsWith("#")) return false;
        boolean hasKeyword = false;
        for (String kw : LINK_KEYWORDS) if (low.contains(kw)) { hasKeyword = true; break; }
        if (!hasKeyword) return false;
        try {
            String host = host(link), baseHost = host(base);
            if (host.isEmpty() || baseHost.isEmpty()) return false;
            if (host.equals(baseHost) || host.endsWith("." + baseHost)) return true;
            for (String ats : ATS_HOSTS) if (host.contains(ats)) return true;
        } catch (Exception ignored) { return false; }
        return false;
    }

    private static String host(String url) {
        try {
            String h = URI.create(url).getHost();
            return h == null ? "" : h.toLowerCase(Locale.ROOT);
        } catch (Exception e) { return ""; }
    }
}
