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

/** 看板趋势数据，按天存储 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "trend_points")
public class TrendPoint {

    @Id
    @Column(length = 32)
    private String id;

    @JsonProperty("date")
    @Column(name = "date_label", length = 16)
    private String dateLabel;

    @JsonProperty("matches")
    @Column(name = "match_count")
    private Integer matches;

    @JsonProperty("pushes")
    @Column(name = "push_count")
    private Integer pushes;

    private Integer sortOrder;
}
