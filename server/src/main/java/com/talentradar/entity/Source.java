package com.talentradar.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** 采集数据源 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "sources")
public class Source {

    @Id
    @Column(length = 32)
    private String id;

    @Column(length = 128)
    private String name;

    /** 企业官网 / 微信公众号 / 招聘平台 */
    @Column(length = 32)
    private String type;

    @Column(length = 512)
    private String url;

    private Boolean enabled;

    @Column(length = 32)
    private String frequency;

    private Instant lastRun;

    @JsonProperty("count")
    @Column(name = "total_count")
    private Integer totalCount;

    /** ok / paused / error */
    @Column(length = 32)
    private String status;
}
