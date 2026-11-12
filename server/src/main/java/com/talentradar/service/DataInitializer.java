package com.talentradar.service;

import com.talentradar.entity.Setting;
import com.talentradar.repo.ActivityRepository;
import com.talentradar.repo.CandidateRepository;
import com.talentradar.repo.JobRepository;
import com.talentradar.repo.SettingRepository;
import com.talentradar.repo.SourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Seeds a brand-new database once, and never overwrites an existing one.
 *
 * <p>The previous implementation only checked whether the candidate table was
 * empty. If candidates were cleared (for example by an empty PUT /api/state),
 * every restart silently deleted jobs, sources, mails, letters and company
 * settings and replaced them with demo data. Now seeding is guarded by a
 * persistent marker plus a "any business table has rows" check, so real data
 * survives restarts and a wiped candidate table.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "talent-radar.seed.enabled", havingValue = "true", matchIfMissing = true)
public class DataInitializer implements ApplicationRunner {

    private static final String INITIALIZED_KEY = "seed.initialized";

    private final StateService stateService;
    private final SettingRepository settingRepo;
    private final CandidateRepository candidateRepo;
    private final JobRepository jobRepo;
    private final SourceRepository sourceRepo;
    private final ActivityRepository activityRepo;

    @Override
    public void run(ApplicationArguments args) {
        if (settingRepo.existsById(INITIALIZED_KEY)) {
            log.info("Database already initialized, skipping seed");
            return;
        }
        boolean hasBusinessData = candidateRepo.count() > 0 || jobRepo.count() > 0
                || sourceRepo.count() > 0 || activityRepo.count() > 0;
        if (hasBusinessData) {
            // An existing installation upgraded from an older build: keep its
            // data and just record the marker so we never seed over it.
            settingRepo.save(new Setting(INITIALIZED_KEY, "existing-data"));
            log.info("Existing business data detected, skipping seed");
            return;
        }
        stateService.replaceAll(stateService.loadSeed());
        settingRepo.save(new Setting(INITIALIZED_KEY, "seeded"));
        log.info("Demo seed data written to database");
    }
}
