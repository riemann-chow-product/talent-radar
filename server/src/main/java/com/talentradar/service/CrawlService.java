package com.talentradar.service;

import com.talentradar.common.BizException;
import com.talentradar.crawl.JobSourceAdapter;
import com.talentradar.entity.Job;
import com.talentradar.entity.Source;
import com.talentradar.repo.JobRepository;
import com.talentradar.repo.SourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/** 采集调度：按数据源选适配器 → 抓取 → 去重 → 落库 → 记录日志 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CrawlService {

    @Value("${talent-radar.crawl.mode:demo}")
    private String mode;

    private final List<JobSourceAdapter> adapters;
    private final JobRepository jobRepo;
    private final SourceRepository sourceRepo;
    private final StateService stateService;
    private final ActivityService activityService;

    @Transactional
    public List<Job> collect(String sourceId) {
        JobSourceAdapter adapter = adapters.stream()
                .filter(a -> a.mode().equalsIgnoreCase(mode))
                .findFirst()
                .orElseGet(() -> adapters.stream().filter(a -> "demo".equals(a.mode())).findFirst().orElseThrow());

        List<Source> targets;
        if (sourceId != null && !sourceId.isBlank()) {
            targets = List.of(sourceRepo.findById(sourceId).orElseThrow(() -> BizException.notFound("数据源")));
        } else {
            targets = sourceRepo.findByEnabledTrue();
        }

        List<Job> existing = jobRepo.findAll();
        List<Job> added = new ArrayList<>();
        Instant now = Instant.now();

        for (Source s : targets) {
            List<Job> fetched = adapter.fetch(s, 3);
            int newCount = 0;
            for (Job j : fetched) {
                boolean duplicate = existing.stream().anyMatch(x ->
                        x.getTitle().equals(j.getTitle()) && x.getCompany().equals(j.getCompany()));
                if (duplicate) continue;
                j.setId(stateService.newId("j"));
                j.setCollectedAt(now);
                existing.add(j);
                added.add(jobRepo.save(j));
                newCount++;
            }
            s.setLastRun(now);
            s.setTotalCount((s.getTotalCount() == null ? 0 : s.getTotalCount()) + newCount);
            s.setStatus("ok");
            sourceRepo.save(s);
        }

        if (added.isEmpty()) {
            activityService.log("info", "[采集] 本轮无新增岗位（全部重复或站点不可达），mode=" + mode);
        } else {
            activityService.add("crawl", "采集完成，新增 <b>" + added.size() + "</b> 个岗位（模式 " + mode + "）");
            activityService.log("ok", "[采集] " + targets.size() + " 个数据源 → 新增 " + added.size() + " 条 / 去重 " + 0 + " 条");
            activityService.bumpTrend("matches", added.size() * 2);
        }
        return added;
    }

    @Transactional(readOnly = true)
    public String currentMode() { return mode; }
}
