package com.talentradar.repo;

import com.talentradar.entity.CollectLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CollectLogRepository extends JpaRepository<CollectLog, String> {
    List<CollectLog> findTop30ByOrderByTimeDesc();
}
