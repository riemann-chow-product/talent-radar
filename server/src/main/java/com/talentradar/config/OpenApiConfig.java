package com.talentradar.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI talentRadarOpenApi() {
        return new OpenAPI().info(new Info()
                .title("才探 TalentRadar API")
                .version("0.1.0")
                .description("AI 智能招聘平台后端：候选人、岗位采集、AI 匹配、推荐语、邮件推送与统计"));
    }
}
