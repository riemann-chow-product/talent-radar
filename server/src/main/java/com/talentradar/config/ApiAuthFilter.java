package com.talentradar.config;

import com.talentradar.repo.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * Lightweight bearer-token guard for every business API.
 *
 * <p>The prototype deliberately has no full Spring Security stack yet. This
 * filter closes the most important gap: without it, /api/bootstrap, /api/state,
 * /api/reset and every other endpoint were reachable anonymously. Only health
 * and login/registration stay public; everything else requires
 * {@code Authorization: Bearer <token>} matching a token issued by AuthService.
 * The resolved user id is exposed as the {@code tr.userId} request attribute so
 * services can later scope data per account.</p>
 *
 * <p>Set {@code AUTH_ENABLED=false} only for local experiments. A real deployment
 * should additionally add token expiry, revocation and per-tenant ownership.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ApiAuthFilter extends OncePerRequestFilter {

    private static final Set<String> PUBLIC_PATHS = Set.of(
            "/api/health",
            "/api/auth/register",
            "/api/auth/login"
    );

    public static final String USER_ID_ATTRIBUTE = "tr.userId";

    private final UserRepository userRepo;

    @Value("${talent-radar.auth.enabled:true}")
    private boolean enabled;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Static pages and springdoc UI are not business APIs.
        if (!path.startsWith("/api/")) return true;
        // Let the browser finish CORS preflight before any credential check.
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
        return PUBLIC_PATHS.contains(path);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        if (!enabled) {
            chain.doFilter(request, response);
            return;
        }
        String token = bearer(request.getHeader(HttpHeaders.AUTHORIZATION));
        if (token.isEmpty()) {
            unauthorized(response, "Authentication required");
            return;
        }
        var user = userRepo.findByAuthToken(token);
        if (user.isEmpty()) {
            unauthorized(response, "Invalid or expired session");
            return;
        }
        request.setAttribute(USER_ID_ATTRIBUTE, user.get().getId());
        chain.doFilter(request, response);
    }

    private static String bearer(String header) {
        if (header == null) return "";
        String value = header.trim();
        if (value.regionMatches(true, 0, "Bearer ", 0, 7)) return value.substring(7).trim();
        return "";
    }

    private static void unauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"code\":401,\"message\":\"" + message + "\"}");
    }
}
