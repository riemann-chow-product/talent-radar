package com.talentradar.repo;

import com.talentradar.entity.TrendPoint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TrendPointRepository extends JpaRepository<TrendPoint, String> {
    List<TrendPoint> findAllByOrderBySortOrderAsc();
}
