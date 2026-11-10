package com.talentradar.repo;

import com.talentradar.entity.MatchRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MatchRecordRepository extends JpaRepository<MatchRecord, String> {
    List<MatchRecord> findByCandidateIdOrderByScoreDesc(String candidateId);
    List<MatchRecord> findByJobIdOrderByScoreDesc(String jobId);
    void deleteByCandidateId(String candidateId);
}
