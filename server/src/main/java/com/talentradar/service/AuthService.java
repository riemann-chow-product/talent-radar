package com.talentradar.service;

import com.talentradar.common.BizException;
import com.talentradar.dto.Requests;
import com.talentradar.entity.User;
import com.talentradar.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * 账号注册 / 登录服务。
 *
 * <p>密码使用 PBKDF2WithHmacSHA256（16 字节随机盐、120000 轮、256 位派生密钥），
 * 数据库只存派生值。演示账号在首次登录时懒创建，方便一键体验。</p>
 *
 * <p>注意：当前为原型级实现，/api/** 业务接口尚未加鉴权拦截器；
 * 若用于生产，应接入 Spring Security + JWT 并对所有业务接口做鉴权。</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    public static final String DEMO_EMAIL = "demo@caitan.ai";
    public static final String DEMO_PASSWORD = "123456";
    private static final String DEMO_NAME = "才探体验官";
    private static final String DEMO_COMPANY = "才探演示团队";

    private static final String ALGORITHM = "PBKDF2WithHmacSHA256";
    private static final int ITERATIONS = 120_000;
    private static final int SALT_BYTES = 16;
    private static final int KEY_BITS = 256;
    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final UserRepository userRepo;
    private final SecureRandom random = new SecureRandom();

    /* ---------------- 对外接口 ---------------- */

    @Transactional
    public Requests.UserView register(Requests.RegisterRequest req) {
        if (req == null) throw new BizException("请求内容不能为空");
        String name = trim(req.name());
        String email = normalizeEmail(req.email());
        String password = req.password() == null ? "" : req.password();
        String company = trim(req.company());

        if (name.isEmpty()) throw new BizException("请输入姓名");
        if (name.length() > 64) throw new BizException("姓名过长，请控制在 64 字以内");
        if (!EMAIL.matcher(email).matches() || email.length() > 128) throw new BizException("请输入有效的邮箱地址");
        if (password.length() < 6) throw new BizException("密码至少 6 位");
        if (company.length() > 128) throw new BizException("公司名称过长，请控制在 128 字以内");
        if (DEMO_EMAIL.equals(email)) throw new BizException(HttpStatus.CONFLICT, "该邮箱为内置演示账号，请直接一键体验或登录");
        if (userRepo.existsByEmail(email)) throw new BizException(HttpStatus.CONFLICT, "该邮箱已注册，请直接登录");

        User user = new User();
        user.setId("usr" + UUID.randomUUID().toString().replace("-", "").substring(0, 20));
        user.setName(name);
        user.setEmail(email);
        user.setCompany(company);
        user.setPasswordHash(hash(password));
        user.setCreatedAt(Instant.now());
        try {
            user = userRepo.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            throw new BizException(HttpStatus.CONFLICT, "该邮箱已注册，请直接登录");
        }
        log.info("新用户注册成功：{}", email);
        return issueToken(user);
    }

    @Transactional
    public Requests.UserView login(Requests.LoginRequest req) {
        if (req == null) throw new BizException("请求内容不能为空");
        String email = normalizeEmail(req.email());
        String password = req.password() == null ? "" : req.password();

        if (email.isEmpty() || password.isEmpty()) throw new BizException(HttpStatus.UNAUTHORIZED, "请输入邮箱和密码");

        User user;
        if (DEMO_EMAIL.equals(email) && DEMO_PASSWORD.equals(password)) {
            user = ensureDemoUser();
        } else {
            user = userRepo.findByEmail(email).orElse(null);
            if (user == null || !verify(password, user.getPasswordHash())) {
                throw new BizException(HttpStatus.UNAUTHORIZED, "邮箱或密码不正确，请重试");
            }
        }
        return issueToken(user);
    }

    @Transactional(readOnly = true)
    public Requests.UserView me(String authorization) {
        String token = bearer(authorization);
        if (token.isEmpty()) throw new BizException(HttpStatus.UNAUTHORIZED, "缺少登录令牌");
        User user = userRepo.findByAuthToken(token)
                .orElseThrow(() -> new BizException(HttpStatus.UNAUTHORIZED, "登录状态已失效，请重新登录"));
        return view(user);
    }

    /* ---------------- 内部实现 ---------------- */

    /** 演示账号懒创建：库里没有就写入一条 PBKDF2 哈希账号 */
    private User ensureDemoUser() {
        return userRepo.findByEmail(DEMO_EMAIL).orElseGet(() -> {
            User demo = new User();
            demo.setId("usr-demo-caitan");
            demo.setName(DEMO_NAME);
            demo.setEmail(DEMO_EMAIL);
            demo.setCompany(DEMO_COMPANY);
            demo.setPasswordHash(hash(DEMO_PASSWORD));
            demo.setCreatedAt(Instant.now());
            try {
                return userRepo.saveAndFlush(demo);
            } catch (DataIntegrityViolationException e) {
                // 并发首次登录时可能已被另一个请求创建，回查即可
                return userRepo.findByEmail(DEMO_EMAIL).orElseThrow(() -> e);
            }
        });
    }

    private Requests.UserView issueToken(User user) {
        byte[] buf = new byte[32];
        random.nextBytes(buf);
        user.setAuthToken(Base64.getUrlEncoder().withoutPadding().encodeToString(buf));
        user.setLastLoginAt(Instant.now());
        return view(userRepo.save(user));
    }

    private Requests.UserView view(User u) {
        return new Requests.UserView(u.getId(), u.getName(), u.getEmail(),
                u.getCompany() == null ? "" : u.getCompany(), u.getAuthToken());
    }

    private static String bearer(String authorization) {
        if (authorization == null) return "";
        String s = authorization.trim();
        if (s.regionMatches(true, 0, "Bearer ", 0, 7)) return s.substring(7).trim();
        return "";
    }

    private static String normalizeEmail(String raw) {
        return trim(raw).toLowerCase(Locale.ROOT);
    }

    private static String trim(String raw) {
        return raw == null ? "" : raw.trim();
    }

    private String hash(String plain) {
        byte[] salt = new byte[SALT_BYTES];
        random.nextBytes(salt);
        byte[] derived = derive(plain, salt, ITERATIONS);
        return "pbkdf2$" + ITERATIONS + "$" + b64(salt) + "$" + b64(derived);
    }

    private boolean verify(String plain, String stored) {
        if (stored == null || !stored.startsWith("pbkdf2$")) return false;
        String[] parts = stored.split("\\$");
        if (parts.length != 4) return false;
        try {
            int iterations = Integer.parseInt(parts[1]);
            byte[] salt = Base64.getDecoder().decode(parts[2]);
            byte[] expected = Base64.getDecoder().decode(parts[3]);
            return MessageDigest.isEqual(expected, derive(plain, salt, iterations));
        } catch (RuntimeException e) {
            return false;
        }
    }

    private static byte[] derive(String plain, byte[] salt, int iterations) {
        try {
            PBEKeySpec spec = new PBEKeySpec(plain.toCharArray(), salt, iterations, KEY_BITS);
            try {
                return SecretKeyFactory.getInstance(ALGORITHM).generateSecret(spec).getEncoded();
            } finally {
                spec.clearPassword();
            }
        } catch (Exception e) {
            throw new IllegalStateException("密码哈希计算失败：" + e.getMessage(), e);
        }
    }

    private static String b64(byte[] bytes) {
        return Base64.getEncoder().encodeToString(bytes);
    }
}
