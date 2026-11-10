package com.talentradar.dto;

import com.talentradar.entity.Job;
import io.swagger.v3.oas.annotations.media.Schema;

/** 接口请求体集合（Java 21 record） */
public final class Requests {

    private Requests() {}

    public record LetterRequest(
            @Schema(description = "候选人 ID") String candidateId,
            @Schema(description = "岗位 ID") String jobId,
            @Schema(description = "professional / warm / concise") String tone,
            @Schema(description = "文案变体序号，用于重新生成") Integer variant) {}

    public record MailRequest(
            String candidateId,
            String jobId,
            @Schema(description = "企业收件邮箱") String to,
            String subject,
            @Schema(description = "推荐语正文") String body) {}

    public record StatusRequest(
            @Schema(description = "sent / opened / replied / failed") String status) {}

    public record CollectRequest(
            @Schema(description = "指定数据源 ID；为空表示全网采集") String sourceId) {}

    public record RegisterRequest(
            @Schema(description = "姓名") String name,
            @Schema(description = "登录邮箱，全库唯一") String email,
            @Schema(description = "密码，至少 6 位") String password,
            @Schema(description = "公司 / 团队，选填") String company) {}

    public record LoginRequest(
            @Schema(description = "登录邮箱") String email,
            @Schema(description = "密码") String password) {}

    /** 登录成功后返回给前端的账号视图，绝不携带密码哈希 */
    public record UserView(
            String id,
            String name,
            String email,
            String company,
            @Schema(description = "原型级不透明登录令牌") String token) {}

    public record MatchView(
            String candidateId,
            String jobId,
            int score,
            java.util.Map<String, Integer> dims,
            java.util.List<String> hits,
            String reason) {}

    /** 全网职位池匹配结果：附带岗位本体，便于前端直接排序展示 */
    public record MarketMatchView(
            String candidateId,
            int score,
            java.util.Map<String, Integer> dims,
            java.util.List<String> hits,
            String reason,
            Job job) {}

    public record OverviewStats(
            long candidates,
            long jobs,
            long runningSources,
            long highMatches,
            long mailsSent,
            long opened,
            long replied,
            long todayJobs,
            int todayMatches,
            int todayPushes,
            int threshold) {}
}
