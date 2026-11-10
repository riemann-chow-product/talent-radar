package com.talentradar.repo;

import com.talentradar.entity.Source;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SourceRepository extends JpaRepository<Source, String> {
    List<Source> findAllByOrderByIdAsc();
    List<Source> findByEnabledTrue();
}
