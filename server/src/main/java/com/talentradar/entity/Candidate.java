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

/** 候选人：简历解析后的结构化人才画像 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "candidates")
public class Candidate {

    @Id
    @Column(length = 32)
    private String id;

    @Column(length = 64)
    private String name;

    @Column(length = 128)
    private String title;

    private Integer years;

    @Column(length = 32)
    private String education;

    @Column(length = 128)
    private String school;

    @Column(length = 64)
    private String city;

    @Column(length = 64)
    private String salary;

    @Column(length = 64)
    private String phone;

    @Column(length = 128)
    private String email;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "skills")
    private List<String> skills;

    /** parsed / matched / pushed */
    @Column(length = 32)
    private String status;

    @Column(length = 255)
    private String resume;

    @Lob
    @Column(name = "intent_text", columnDefinition = "LONGTEXT")
    private String intent;

    @Lob
    @Column(name = "highlight_text", columnDefinition = "LONGTEXT")
    private String highlight;

    private Instant uploadedAt;
}
