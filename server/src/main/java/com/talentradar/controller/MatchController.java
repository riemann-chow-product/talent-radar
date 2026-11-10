package com.talentradar.controller;

import com.talentradar.dto.Requests.MatchView;
import com.talentradar.service.MatchingService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchingService matchingService;

    @Operation(summary = "实时计算指定候选人的岗位匹配（按分数降序）")
    @GetMapping
    public List<MatchView> matches(@RequestParam String candidateId,
                                   @RequestParam(required = false) Integer limit) {
        return matchingService.topMatches(candidateId, limit);
    }

    @Operation(summary = "读取缓存的匹配结果")
    @GetMapping("/cached")
    public List<MatchView> cached(@RequestParam String candidateId) {
        return matchingService.cached(candidateId);
    }

    @Operation(summary = "扫描多公司公开职位池，按五维匹配度降序返回最匹配的 Top N（含公司多样性限额）")
    @GetMapping("/market")
    public Map<String, Object> market(@RequestParam String candidateId,
                                      @RequestParam(defaultValue = "100") int topN) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("pool", matchingService.marketPoolSize());
        m.put("coverage", matchingService.marketCoverage());
        m.put("candidateId", candidateId);
        m.put("items", matchingService.marketTop(candidateId, topN));
        return m;
    }

    @Operation(summary = "多公司职位池覆盖情况：公司数、公司类型分布、各公司岗位数")
    @GetMapping("/market/sources")
    public Map<String, Object> marketSources() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("pool", matchingService.marketPoolSize());
        m.putAll(matchingService.marketCoverage());
        return m;
    }

    @Operation(summary = "把全网最匹配的 Top N 捞入岗位库（按 JD 链接去重）")
    @PostMapping("/market/import")
    public Map<String, Object> importMarket(@RequestParam String candidateId,
                                            @RequestParam(defaultValue = "100") int topN) {
        Map<String, Object> r = matchingService.importMarketTop(candidateId, topN);
        r.put("coverage", matchingService.marketCoverage());
        return r;
    }

    @Operation(summary = "重算并缓存全库匹配结果")
    @PostMapping("/recompute")
    public Map<String, Object> recompute() {
        long n = matchingService.recomputeAll();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("generated", n);
        return m;
    }
}
