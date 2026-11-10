package com.talentradar.repo;

import com.talentradar.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface JobRepository extends JpaRepository<Job, String> {
    List<Job> findAllByOrderByCollectedAtDesc();
    List<Job> findBySource(String source);
    long countByCollectedAtAfter(Instant since);
}
