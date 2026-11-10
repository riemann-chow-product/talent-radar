package com.talentradar.controller;

import com.talentradar.service.StateService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final StateService stateService;

    @GetMapping
    public Map<String, Object> get() { return stateService.getCompany(); }

    @PutMapping
    public Map<String, Object> update(@RequestBody Map<String, Object> company) {
        return stateService.putCompany(company);
    }
}
