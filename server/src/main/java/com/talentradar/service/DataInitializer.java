package com.talentradar.service;

import com.talentradar.repo.CandidateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** 空库时写入演示种子数据；已有数据不覆盖 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "talent-radar.seed.enabled", havingValue = "true", matchIfMissing = true)
public class DataInitializer implements ApplicationRunner {

    private final StateService stateService;
    private final CandidateRepository candidateRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (candidateRepository.count() > 0) {
            log.info("数据库已有数据，跳过种子初始化");
            return;
        }
        stateService.replaceAll(stateService.loadSeed());
        log.info("演示种子数据已写入数据库");
    }
}
