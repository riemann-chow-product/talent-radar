package com.talentradar.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

/**
 * Cross-origin policy for the standalone static front end.
 *
 * <p>Same-origin deployments (the Docker image serves index.html next to the
 * API) never need CORS. For local development or LAN access, list the exact
 * origins via {@code CORS_ORIGINS}. A wildcard is refused: combined with the
 * anonymous API access it used to allow, it would let any third-party page read
 * and overwrite the whole database.</p>
 */
@Slf4j
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private static final String FALLBACK = "http://localhost:8080,http://127.0.0.1:8080";

    @Value("${talent-radar.cors.allowed-origins:}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String configured = allowedOrigins == null ? "" : allowedOrigins.trim();
        if (configured.isEmpty()) {
            configured = FALLBACK;
        } else if (configured.contains("*")) {
            log.warn("CORS_ORIGINS contains a wildcard; falling back to loopback origins. "
                    + "Set explicit origins instead (for example https://your-domain.example).");
            configured = FALLBACK;
        }
        String[] origins = Arrays.stream(configured.split("\\s*,\\s*"))
                .filter(s -> !s.isBlank())
                .distinct()
                .toArray(String[]::new);
        log.info("CORS allowed origins: {}", Arrays.toString(origins));
        registry.addMapping("/api/**")
                .allowedOrigins(origins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("Content-Type", "Authorization")
                .exposedHeaders("Content-Type")
                .allowCredentials(false)
                .maxAge(3600);
    }
}
