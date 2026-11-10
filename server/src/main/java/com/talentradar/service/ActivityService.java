package com.talentradar.service;

import com.talentradar.entity.Activity;
import com.talentradar.entity.CollectLog;
import com.talentradar.entity.TrendPoint;
import com.talentradar.repo.ActivityRepository;
import com.talentradar.repo.CollectLogRepository;
import com.talentradar.repo.TrendPointRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepo;
    private final CollectLogRepository logRepo;
    private final TrendPointRepository trendRepo;
    private final StateService stateService;

    @Transactional
    public Activity add(String type, String text) {
        return activityRepo.save(new Activity(stateService.newId("a"), type, text, Instant.now()));
    }

    @Transactional
    public CollectLog log(String level, String text) {
        return logRepo.save(new CollectLog("log" + stateService.newId("x"), Instant.now(), level, text));
    }

    /** 累加今日趋势点（matches / pushes） */
    @Transactional
    public void bumpTrend(String kind, int n) {
        List<TrendPoint> points = trendRepo.findAllByOrderBySortOrderAsc();
        if (points.isEmpty()) return;
        TrendPoint today = points.get(points.size() - 1);
        if ("pushes".equals(kind)) today.setPushes(Math.max(0, today.getPushes() == null ? 0 : today.getPushes()) + n);
        else today.setMatches(Math.max(0, today.getMatches() == null ? 0 : today.getMatches()) + n);
        trendRepo.save(today);
    }
}
