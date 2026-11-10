package com.talentradar.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** AI 生成的推荐语草稿 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "letters")
public class Letter {

    @Id
    @Column(length = 32)
    private String id;

    @Column(name = "candidate_id", length = 32)
    private String candidateId;

    @Column(name = "job_id", length = 32)
    private String jobId;

    @Column(length = 32)
    private String tone;

    @Column(length = 255)
    private String subject;

    @Lob
    @Column(name = "body_text", columnDefinition = "LONGTEXT")
    private String body;

    private Instant createdAt;
}
