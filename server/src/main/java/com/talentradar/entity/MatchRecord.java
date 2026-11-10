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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/** AI 匹配结果缓存：候选人 × 岗位 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "match_records")
public class MatchRecord {

    @Id
    @Column(length = 32)
    private String id;

    @Column(name = "candidate_id", length = 32)
    private String candidateId;

    @Column(name = "job_id", length = 32)
    private String jobId;

    private Integer score;

    /** 五维分数：skill / exp / edu / city / salary */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "dims")
    private Map<String, Integer> dims;

    /** 命中的技能标签 */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "hits")
    private List<String> hits;

    @Lob
    @Column(name = "reason_text", columnDefinition = "LONGTEXT")
    private String reason;

    private Instant createdAt;
}
