package com.talentradar.controller;

import com.talentradar.dto.Requests.LetterRequest;
import com.talentradar.entity.Letter;
import com.talentradar.repo.LetterRepository;
import com.talentradar.service.LetterService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/letters")
@RequiredArgsConstructor
public class LetterController {

    private final LetterService letterService;
    private final LetterRepository repo;

    @GetMapping
    public List<Letter> list() { return repo.findAllByOrderByCreatedAtDesc(); }

    /** 只生成不落库，供前端编辑器实时预览 */
    @PostMapping("/generate")
    public Map<String, Object> generate(@RequestBody LetterRequest req) {
        String body = letterService.generate(req.candidateId(), req.jobId(), req.tone(), req.variant());
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("body", body);
        m.put("tone", req.tone());
        m.put("candidateId", req.candidateId());
        m.put("jobId", req.jobId());
        return m;
    }

    /** 生成并保存为草稿 */
    @PostMapping
    public Letter create(@RequestBody LetterRequest req) {
        return letterService.generateAndSave(req.candidateId(), req.jobId(), req.tone(), req.variant());
    }
}
