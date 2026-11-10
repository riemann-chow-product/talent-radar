package com.talentradar.controller;

import com.talentradar.dto.Requests.OverviewStats;
import com.talentradar.entity.Activity;
import com.talentradar.entity.CollectLog;
import com.talentradar.entity.MailRecord;
import com.talentradar.entity.TrendPoint;
import com.talentradar.repo.ActivityRepository;
import com.talentradar.repo.CandidateRepository;
import com.talentradar.repo.CollectLogRepository;
import com.talentradar.repo.JobRepository;
import com.talentradar.repo.MailRecordRepository;
import com.talentradar.repo.SourceRepository;
import com.talentradar.repo.TrendPointRepository;
import com.talentradar.service.MatchingService;
import com.talentradar.service.StateService;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class StatsController {

    private final CandidateRepository candidateRepo;
    private final JobRepository jobRepo;
    private final SourceRepository sourceRepo;
    private final MailRecordRepository mailRepo;
    private final ActivityRepository activityRepo;
    private final CollectLogRepository logRepo;
    private final TrendPointRepository trendRepo;
    private final MatchingService matchingService;
    private final StateService stateService;

    @GetMapping("/stats/overview")
    @Transactional(readOnly = true)
    public OverviewStats overview() {
        Map<String, Object> company = stateService.getCompany();
        int threshold = company.get("threshold") instanceof Number n ? n.intValue() : 75;
        long high = candidateRepo.findAll().stream()
                .filter(c -> matchingService.bestScore(c.getId()) >= threshold).count();
        List<MailRecord> mails = mailRepo.findAll();
        long opened = mails.stream().filter(m -> "opened".equals(m.getStatus()) || "replied".equals(m.getStatus())).count();
        long replied = mails.stream().filter(m -> "replied".equals(m.getStatus())).count();
        List<TrendPoint> trend = trendRepo.findAllByOrderBySortOrderAsc();
        TrendPoint today = trend.isEmpty() ? null : trend.get(trend.size() - 1);

        return new OverviewStats(
                candidateRepo.count(),
                jobRepo.count(),
                sourceRepo.findByEnabledTrue().size(),
                high,
                mails.size(),
                opened,
                replied,
                jobRepo.countByCollectedAtAfter(Instant.now().minus(24, ChronoUnit.HOURS)),
                today == null || today.getMatches() == null ? 0 : today.getMatches(),
                today == null || today.getPushes() == null ? 0 : today.getPushes(),
                threshold);
    }

    @GetMapping("/activities")
    public List<Activity> activities() { return activityRepo.findTop40ByOrderByTimeDesc(); }

    @GetMapping("/logs")
    public List<CollectLog> logs() { return logRepo.findTop30ByOrderByTimeDesc(); }

    @GetMapping("/trend")
    public List<TrendPoint> trend() { return trendRepo.findAllByOrderBySortOrderAsc(); }
}
