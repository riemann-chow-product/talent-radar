package com.talentradar.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * 平台账号。密码只保存 PBKDF2 派生值，绝不存明文；对外只暴露 UserView。
 * 全部文本列显式声明长度，避免 Hibernate 6 在 MySQL 方言下把 @Lob String 建成 tinytext。
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users", uniqueConstraints = @UniqueConstraint(name = "uk_users_email", columnNames = "email"))
public class User {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "name", length = 64, nullable = false)
    private String name;

    @Column(name = "email", length = 128, nullable = false)
    private String email;

    @Column(name = "company", length = 128)
    private String company;

    /** 格式：pbkdf2$<iterations>$<saltBase64>$<hashBase64> */
    @Column(name = "password_hash", length = 255, nullable = false)
    private String passwordHash;

    /** 登录令牌（原型级不透明 token，/api/auth/me 用它回查身份） */
    @Column(name = "auth_token", length = 128)
    private String authToken;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;
}
