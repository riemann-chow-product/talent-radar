package com.talentradar;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 才探 TalentRadar · AI 智能招聘平台后端服务
 *
 * 数据存储：MySQL 8（spring.jpa.hibernate.ddl-auto=update 自动建表/升级）
 * 接口文档：http://localhost:8080/swagger-ui.html
 */
@SpringBootApplication
@EnableScheduling
public class TalentRadarApplication {
    public static void main(String[] args) {
        SpringApplication.run(TalentRadarApplication.class, args);
    }
}
