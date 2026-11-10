package com.talentradar.controller;

import com.talentradar.common.BizException;
import com.talentradar.entity.Job;
import com.talentradar.entity.Source;
import com.talentradar.repo.SourceRepository;
import com.talentradar.service.CrawlService;
import com.talentradar.service.StateService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/sources")
@RequiredArgsConstructor
public class SourceController {

    private final SourceRepository repo;
    private final CrawlService crawlService;
    private final StateService stateService;

    @GetMapping
    public List<Source> list() { return repo.findAllByOrderByIdAsc(); }

    @GetMapping("/{id}")
    public Source get(@PathVariable String id) {
        return repo.findById(id).orElseThrow(() -> BizException.notFound("数据源"));
    }

    @PostMapping
    public Source create(@RequestBody Source s) {
        if (s.getId() == null || s.getId().isBlank()) s.setId(stateService.newId("s"));
        if (s.getEnabled() == null) s.setEnabled(true);
        if (s.getTotalCount() == null) s.setTotalCount(0);
        if (s.getLastRun() == null) s.setLastRun(Instant.now());
        if (s.getStatus() == null) s.setStatus(s.getEnabled() ? "ok" : "paused");
        return repo.save(s);
    }

    @PutMapping("/{id}")
    public Source update(@PathVariable String id, @RequestBody Source s) {
        repo.findById(id).orElseThrow(() -> BizException.notFound("数据源"));
        s.setId(id);
        return repo.save(s);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        if (!repo.existsById(id)) throw BizException.notFound("数据源");
        repo.deleteById(id);
    }

    @PostMapping("/{id}/collect")
    public List<Job> collect(@PathVariable String id) {
        return crawlService.collect(id);
    }
}
