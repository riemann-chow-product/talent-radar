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

/** 采集任务运行日志 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "collect_logs")
public class CollectLog {

    @Id
    @Column(length = 32)
    private String id;

    private Instant time;

    @Column(length = 16)
    private String level;

    @Lob
    @Column(name = "content", columnDefinition = "LONGTEXT")
    private String text;
}
