package com.talentradar.controller;

import com.talentradar.common.BizException;
import com.talentradar.entity.Candidate;
import com.talentradar.repo.CandidateRepository;
import com.talentradar.service.ResumeParserService;
import com.talentradar.service.StateService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/candidates")
@RequiredArgsConstructor
public class CandidateController {

    private final CandidateRepository repo;
    private final ResumeParserService parser;
    private final StateService stateService;

    @GetMapping
    public List<Candidate> list(@RequestParam(required = false) String q) {
        List<Candidate> all = repo.findAllByOrderByUploadedAtDesc();
        if (q == null || q.isBlank()) return all;
        String key = q.toLowerCase();
        return all.stream().filter(c -> (c.getName() + " " + c.getTitle() + " " + c.getCity() + " "
                + String.join(" ", c.getSkills() == null ? List.of() : c.getSkills())).toLowerCase().contains(key)).toList();
    }

    @GetMapping("/{id}")
    public Candidate get(@PathVariable String id) {
        return repo.findById(id).orElseThrow(() -> BizException.notFound("候选人"));
    }

    @PostMapping
    public Candidate create(@RequestBody Candidate c) {
        if (c.getId() == null || c.getId().isBlank()) c.setId(stateService.newId("c"));
        if (c.getUploadedAt() == null) c.setUploadedAt(java.time.Instant.now());
        if (c.getStatus() == null) c.setStatus("parsed");
        return repo.save(c);
    }

    @PutMapping("/{id}")
    public Candidate update(@PathVariable String id, @RequestBody Candidate c) {
        repo.findById(id).orElseThrow(() -> BizException.notFound("候选人"));
        c.setId(id);
        return repo.save(c);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        if (!repo.existsById(id)) throw BizException.notFound("候选人");
        repo.deleteById(id);
    }

    /** 上传简历并解析成结构化候选人 */
    @PostMapping("/upload")
    public Candidate upload(@RequestParam("file") MultipartFile file) {
        return parser.parse(file);
    }
}
