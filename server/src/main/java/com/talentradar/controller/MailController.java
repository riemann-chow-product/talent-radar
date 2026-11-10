package com.talentradar.controller;

import com.talentradar.dto.Requests.MailRequest;
import com.talentradar.dto.Requests.StatusRequest;
import com.talentradar.entity.MailRecord;
import com.talentradar.repo.MailRecordRepository;
import com.talentradar.service.MailDeliveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/mails")
@RequiredArgsConstructor
public class MailController {

    private final MailDeliveryService mailService;
    private final MailRecordRepository repo;

    @GetMapping
    public List<MailRecord> list(@RequestParam(required = false) String status) {
        return status == null || status.isBlank() ? repo.findAllByOrderBySentAtDesc() : repo.findByStatus(status);
    }

    @GetMapping("/{id}")
    public MailRecord get(@PathVariable String id) {
        return repo.findById(id).orElseThrow(() -> com.talentradar.common.BizException.notFound("推送记录"));
    }

    @PostMapping
    public MailRecord send(@RequestBody MailRequest req) {
        return mailService.send(req);
    }

    /** 回执追踪：邮件打开 / 企业回复 / 手动标记 */
    @PatchMapping("/{id}/status")
    public MailRecord updateStatus(@PathVariable String id, @RequestBody StatusRequest req) {
        return mailService.updateStatus(id, req.status());
    }

    @PostMapping("/{id}/resend")
    public MailRecord resend(@PathVariable String id) {
        return mailService.resend(id);
    }
}
