package com.talentradar.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class HealthController {

    private final Environment env;

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    public HealthController(Environment env) {
        this.env = env;
    }

    /** 前端启动时探测此接口，判断是否可以切换到 MySQL 服务模式 */
    @GetMapping("/api/health")
    public Map<String, Object> health() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("status", "UP");
        m.put("service", "talent-radar-server");
        m.put("version", "0.1.0");
        m.put("storage", datasourceUrl.startsWith("jdbc:mysql") ? "MySQL" : "H2(test)");
        m.put("profiles", String.join(",", env.getActiveProfiles()));
        return m;
    }
}
