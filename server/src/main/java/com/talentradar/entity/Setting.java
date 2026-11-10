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

/** 键值配置：company 存放企业/发件/模型设置，seq 存放前端 id 序列 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "settings")
public class Setting {

    @Id
    @Column(name = "setting_key", length = 64)
    private String settingKey;

    // Hibernate 6 在 MySQL 方言下会把 @Lob String 建成 tinytext(255B)，
    // 显式声明 LONGTEXT，避免 company 设置 JSON 被截断（H2 MySQL 兼容模式同样支持）。
    @Lob
    @Column(name = "setting_value", columnDefinition = "LONGTEXT")
    private String value;
}
