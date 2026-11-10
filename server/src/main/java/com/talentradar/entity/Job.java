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

/** 岗位：从企业官网 / 公众号 / 招聘平台采集并清洗后的 JD */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "jobs")
public class Job {

    @Id
    @Column(length = 32)
    private String id;

    @Column(length = 128)
    private String title;

    @Column(length = 128)
    private String company;

    @Column(length = 64)
    private String city;

    @Column(length = 64)
    private String salary;

    private Integer minSalary;
    private Integer maxSalary;
    private Integer headcount;

    /** 企业官网 / 微信公众号 / 招聘平台 */
    @Column(length = 32)
    private String source;

    @Column(name = "source_name", length = 128)
    private String sourceName;

    /** 公司画像：互联网大厂 / 独角兽 / 融资期公司 / 上市公司 */
    @Column(name = "company_type", length = 32)
    private String companyType;

    /** 融资阶段：公开资料整理，非实时融资状态 */
    @Column(name = "funding_stage", length = 64)
    private String fundingStage;

    @Column(length = 512)
    private String url;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tags")
    private List<String> tags;

    private Integer minYears;

    @Column(length = 32)
    private String minEdu;

    @Lob
    @Column(name = "jd_text", columnDefinition = "LONGTEXT")
    private String jd;

    private Instant publishedAt;
    private Instant collectedAt;
}
