package com.talentradar.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
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

/** 推荐邮件推送记录 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "mail_records")
public class MailRecord {

    @Id
    @Column(length = 32)
    private String id;

    @Column(name = "candidate_id", length = 32)
    private String candidateId;

    @Column(name = "job_id", length = 32)
    private String jobId;

    /** JSON 字段名与前端保持一致：to */
    @JsonProperty("to")
    @Column(name = "to_address", length = 128)
    private String toAddress;

    @Column(length = 255)
    private String subject;

    @Lob
    @Column(name = "body_text", columnDefinition = "LONGTEXT")
    private String body;

    /** sent / opened / replied / failed / draft */
    @Column(length = 32)
    private String status;

    private Instant sentAt;
}
