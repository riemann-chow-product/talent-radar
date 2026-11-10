-- 才探 TalentRadar · MySQL 8 数据库初始化脚本（可选）
--
-- 默认情况下 spring.jpa.hibernate.ddl-auto=update 会在启动时自动建表，
-- 本脚本用于 DBA 预先建库、审阅表结构，或在生产环境需要显式控制字符集/字段类型时执行。
-- 列名与 com.talentradar.entity 下的 JPA 实体一一对应（Hibernate 驼峰转下划线命名策略）。

CREATE DATABASE IF NOT EXISTS `talent_radar`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE `talent_radar`;

CREATE TABLE IF NOT EXISTS `candidates` (
  `id`            VARCHAR(32)  NOT NULL PRIMARY KEY,
  `name`          VARCHAR(64),
  `title`         VARCHAR(128),
  `years`         INT,
  `education`     VARCHAR(32),
  `school`        VARCHAR(128),
  `city`          VARCHAR(64),
  `salary`        VARCHAR(64),
  `phone`         VARCHAR(64),
  `email`         VARCHAR(128),
  `skills`        JSON,
  `status`        VARCHAR(32),
  `resume`        VARCHAR(255),
  `intent_text`   LONGTEXT,
  `highlight_text` LONGTEXT,
  `uploaded_at`   DATETIME(6),
  KEY `idx_candidate_uploaded` (`uploaded_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `jobs` (
  `id`            VARCHAR(32)  NOT NULL PRIMARY KEY,
  `title`         VARCHAR(128),
  `company`       VARCHAR(128),
  `city`          VARCHAR(64),
  `salary`        VARCHAR(64),
  `min_salary`    INT,
  `max_salary`    INT,
  `headcount`     INT,
  `source`        VARCHAR(32),
  `source_name`   VARCHAR(128),
  `url`           VARCHAR(512),
  `tags`          JSON,
  `min_years`     INT,
  `min_edu`       VARCHAR(32),
  `jd_text`       LONGTEXT,
  `published_at`  DATETIME(6),
  `collected_at`  DATETIME(6),
  KEY `idx_job_collected` (`collected_at`),
  KEY `idx_job_dedupe` (`title`, `company`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sources` (
  `id`            VARCHAR(32)  NOT NULL PRIMARY KEY,
  `name`          VARCHAR(128),
  `type`          VARCHAR(32),
  `url`           VARCHAR(512),
  `enabled`       BOOLEAN,
  `frequency`     VARCHAR(32),
  `last_run`      DATETIME(6),
  `total_count`   INT,
  `status`        VARCHAR(32)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `match_records` (
  `id`            VARCHAR(32)  NOT NULL PRIMARY KEY,
  `candidate_id`  VARCHAR(32),
  `job_id`        VARCHAR(32),
  `score`         INT,
  `dims`          JSON,
  `hits`          JSON,
  `reason_text`   LONGTEXT,
  `created_at`    DATETIME(6),
  KEY `idx_match_candidate_score` (`candidate_id`, `score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `letters` (
  `id`            VARCHAR(32)  NOT NULL PRIMARY KEY,
  `candidate_id`  VARCHAR(32),
  `job_id`        VARCHAR(32),
  `tone`          VARCHAR(32),
  `subject`       VARCHAR(255),
  `body_text`     LONGTEXT,
  `created_at`    DATETIME(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mail_records` (
  `id`            VARCHAR(32)  NOT NULL PRIMARY KEY,
  `candidate_id`  VARCHAR(32),
  `job_id`        VARCHAR(32),
  `to_address`    VARCHAR(128),
  `subject`       VARCHAR(255),
  `body_text`     LONGTEXT,
  `status`        VARCHAR(32),
  `sent_at`       DATETIME(6),
  KEY `idx_mail_sent` (`sent_at`),
  KEY `idx_mail_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `activities` (
  `id`            VARCHAR(32)  NOT NULL PRIMARY KEY,
  `type`          VARCHAR(32),
  `content`       LONGTEXT,
  `time`          DATETIME(6),
  KEY `idx_activity_time` (`time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `collect_logs` (
  `id`            VARCHAR(32)  NOT NULL PRIMARY KEY,
  `time`          DATETIME(6),
  `level`         VARCHAR(16),
  `content`       LONGTEXT,
  KEY `idx_log_time` (`time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `trend_points` (
  `id`            VARCHAR(32)  NOT NULL PRIMARY KEY,
  `date_label`    VARCHAR(16),
  `match_count`   INT,
  `push_count`    INT,
  `sort_order`    INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `settings` (
  `setting_key`   VARCHAR(64)  NOT NULL PRIMARY KEY,
  `setting_value` LONGTEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 平台账号：密码存 PBKDF2 派生值，auth_token 为登录令牌
CREATE TABLE IF NOT EXISTS `users` (
  `id`             VARCHAR(64)  NOT NULL PRIMARY KEY,
  `name`           VARCHAR(64)  NOT NULL,
  `email`          VARCHAR(128) NOT NULL,
  `company`        VARCHAR(128),
  `password_hash`  VARCHAR(255) NOT NULL,
  `auth_token`     VARCHAR(128),
  `created_at`     DATETIME(6),
  `last_login_at`  DATETIME(6),
  UNIQUE KEY `uk_users_email` (`email`),
  KEY `idx_users_token` (`auth_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 种子数据由 DataInitializer 在库为空时自动写入（server/src/main/resources/seed/state.json），
-- 可通过 SEED_ENABLED=false 关闭。
