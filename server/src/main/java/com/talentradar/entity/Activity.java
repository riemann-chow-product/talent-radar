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

/** 平台事件流 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "activities")
public class Activity {

    @Id
    @Column(length = 32)
    private String id;

    /** mail / parse / crawl / match / reply */
    @Column(length = 32)
    private String type;

    /** 允许包含简单 HTML 强调标签，前端按富文本片段渲染 */
    @Lob
    @Column(name = "content", columnDefinition = "LONGTEXT")
    private String text;

    private Instant time;
}
