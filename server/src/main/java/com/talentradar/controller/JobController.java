package com.talentradar.controller;

import com.talentradar.common.BizException;
import com.talentradar.dto.Requests.CollectRequest;
import com.talentradar.entity.Job;
import com.talentradar.repo.JobRepository;
import com.talentradar.service.CrawlService;
import com.talentradar.service.StateService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobRepository repo;
    private final CrawlService crawlService;
    private final StateService stateService;

    @GetMapping
    public List<Job> list(@RequestParam(required = false) String source,
                          @RequestParam(required = false) String q) {
        List<Job> all = repo.findAllByOrderByCollectedAtDesc();
        if (source != null && !source.isBlank()) all = all.stream().filter(j -> source.equals(j.getSource())).toList();
        if (q != null && !q.isBlank()) {
            String key = q.toLowerCase();
            all = all.stream().filter(j -> (j.getTitle() + " " + j.getCompany() + " " + j.getCity() + " "
                    + String.join(" ", j.getTags() == null ? List.of() : j.getTags())).toLowerCase().contains(key)).toList();
        }
        return all;
    }

    @GetMapping("/{id}")
    public Job get(@PathVariable String id) {
        return repo.findById(id).orElseThrow(() -> BizException.notFound("岗位"));
    }

    @PostMapping
    public Job create(@RequestBody Job j) {
        if (j.getId() == null || j.getId().isBlank()) j.setId(stateService.newId("j"));
        if (j.getCollectedAt() == null) j.setCollectedAt(Instant.now());
        if (j.getPublishedAt() == null) j.setPublishedAt(j.getCollectedAt());
        return repo.save(j);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        if (!repo.existsById(id)) throw BizException.notFound("岗位");
        repo.deleteById(id);
    }

    /** 触发一次采集：sourceId 为空表示全网 */
    @PostMapping("/collect")
    public List<Job> collect(@RequestBody(required = false) CollectRequest req) {
        return crawlService.collect(req == null ? null : req.sourceId());
    }
}
