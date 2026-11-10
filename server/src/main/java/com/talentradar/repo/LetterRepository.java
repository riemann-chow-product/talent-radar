package com.talentradar.repo;

import com.talentradar.entity.Letter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LetterRepository extends JpaRepository<Letter, String> {
    List<Letter> findAllByOrderByCreatedAtDesc();
}
