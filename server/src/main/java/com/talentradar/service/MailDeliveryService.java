package com.talentradar.service;

import com.talentradar.common.BizException;
import com.talentradar.dto.Requests.MailRequest;
import com.talentradar.entity.Candidate;
import com.talentradar.entity.Job;
import com.talentradar.entity.MailRecord;
import com.talentradar.repo.CandidateRepository;
import com.talentradar.repo.JobRepository;
import com.talentradar.repo.MailRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * 推荐邮件投递。
 * talent-radar.mail.enabled=false（默认）时只落库、不连 SMTP；
 * 设为 true 且配置 spring.mail.* 后才会真实发信。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MailDeliveryService {

    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    @Value("${talent-radar.mail.enabled:false}")
    private boolean enabled;

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final MailRecordRepository mailRepo;
    private final CandidateRepository candidateRepo;
    private final JobRepository jobRepo;
    private final StateService stateService;
    private final LetterService letterService;
    private final MatchingService matchingService;
    private final ActivityService activityService;

    @Transactional
    public MailRecord send(MailRequest req) {
        if (req == null || req.to() == null || !EMAIL.matcher(req.to().trim()).matches()) {
            throw new IllegalArgumentException("收件邮箱格式不正确");
        }
        Candidate c = candidateRepo.findById(req.candidateId()).orElseThrow(() -> BizException.notFound("候选人"));
        Job j = jobRepo.findById(req.jobId()).orElseThrow(() -> BizException.notFound("岗位"));

        int score = matchingService.score(c, j).score();
        String subject = req.subject();
        String body = req.body();
        if (subject == null || subject.isBlank()) subject = letterService.subject(c, j, score);
        if (body == null || body.isBlank()) body = letterService.generate(c, j, score, "professional", 0);

        MailRecord record = new MailRecord();
        record.setId(stateService.newId("m"));
        record.setCandidateId(c.getId());
        record.setJobId(j.getId());
        record.setToAddress(req.to().trim());
        record.setSubject(subject);
        record.setBody(body);
        record.setSentAt(Instant.now());
        record.setStatus("sent");

        if (enabled) {
            JavaMailSender sender = mailSenderProvider.getIfAvailable();
            if (sender == null) {
                record.setStatus("failed");
                activityService.log("info", "[mail] 未配置 JavaMailSender，投递失败");
            } else {
                try {
                    Map<String, Object> co = stateService.getCompany();
                    SimpleMailMessage msg = new SimpleMailMessage();
                    msg.setFrom(String.valueOf(co.getOrDefault("senderEmail", "radar@example.com")));
                    msg.setTo(record.getToAddress());
                    Object cc = co.get("cc");
                    if (cc != null && !String.valueOf(cc).isBlank()) msg.setCc(String.valueOf(cc));
                    msg.setSubject(record.getSubject());
                    msg.setText(record.getBody());
                    sender.send(msg);
                    activityService.log("ok", "[mail] " + record.getToAddress() + " → SMTP delivered");
                } catch (Exception e) {
                    log.warn("邮件投递失败 to={} reason={}", record.getToAddress(), e.getMessage());
                    record.setStatus("failed");
                    activityService.log("info", "[mail] " + record.getToAddress() + " → failed: " + e.getMessage());
                }
            }
        } else {
            activityService.log("ok", "[mail] " + record.getToAddress() + " → 演示模式，仅落库未真实投递");
        }

        MailRecord saved = mailRepo.save(record);
        c.setStatus("pushed");
        candidateRepo.save(c);
        activityService.add("mail", "推荐邮件" + (enabled ? "已送达" : "已生成")
                + " <b>" + j.getCompany() + "</b>，候选人 " + c.getName() + " · " + c.getTitle());
        activityService.bumpTrend("pushes", 1);
        return saved;
    }

    @Transactional
    public MailRecord updateStatus(String id, String status) {
        MailRecord m = mailRepo.findById(id).orElseThrow(() -> BizException.notFound("推送记录"));
        if (!java.util.Set.of("sent", "opened", "replied", "failed", "draft").contains(status)) {
            throw new IllegalArgumentException("不支持的状态：" + status);
        }
        m.setStatus(status);
        return mailRepo.save(m);
    }

    @Transactional
    public MailRecord resend(String id) {
        MailRecord m = mailRepo.findById(id).orElseThrow(() -> BizException.notFound("推送记录"));
        m.setStatus("sent");
        m.setSentAt(Instant.now());
        MailRecord saved = mailRepo.save(m);
        activityService.log("ok", "[mail] " + m.getToAddress() + " → retry queued");
        return saved;
    }
}
