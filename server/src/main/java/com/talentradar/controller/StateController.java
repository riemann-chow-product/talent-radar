package com.talentradar.controller;

import com.talentradar.service.StateService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** 前端状态快照同步（原型桥接接口，详见 StateService 注释） */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class StateController {

    private final StateService stateService;

    @Operation(summary = "一次性加载全量业务数据到前端")
    @GetMapping("/bootstrap")
    public Map<String, Object> bootstrap() {
        return stateService.bootstrap();
    }

    @Operation(summary = "把前端全量状态事务性写回数据库")
    @PutMapping("/state")
    public Map<String, Object> sync(@RequestBody Map<String, Object> snapshot) {
        return stateService.replaceAll(snapshot);
    }

    @Operation(summary = "恢复演示种子数据")
    @PostMapping("/reset")
    public Map<String, Object> reset() {
        return stateService.reset();
    }
}
