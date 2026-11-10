package com.talentradar.repo;

import com.talentradar.entity.MailRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MailRecordRepository extends JpaRepository<MailRecord, String> {
    List<MailRecord> findAllByOrderBySentAtDesc();
    List<MailRecord> findByStatus(String status);
}
