package com.talentradar.repo;

import com.talentradar.entity.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CandidateRepository extends JpaRepository<Candidate, String> {
    List<Candidate> findAllByOrderByUploadedAtDesc();
}
