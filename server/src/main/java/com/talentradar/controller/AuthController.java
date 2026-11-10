package com.talentradar.controller;

import com.talentradar.dto.Requests;
import com.talentradar.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 注册 / 登录 / 当前账号。前端 assets/js/auth.js 调用此组接口 */
@Tag(name = "账号认证", description = "注册、登录与当前登录账号")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "注册账号，写入 MySQL users 表")
    @PostMapping("/register")
    public Requests.UserView register(@RequestBody Requests.RegisterRequest req) {
        return authService.register(req);
    }

    @Operation(summary = "登录，校验 PBKDF2 密码哈希")
    @PostMapping("/login")
    public Requests.UserView login(@RequestBody Requests.LoginRequest req) {
        return authService.login(req);
    }

    @Operation(summary = "用 Authorization: Bearer <token> 查询当前账号")
    @GetMapping("/me")
    public Requests.UserView me(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return authService.me(authorization);
    }
}
