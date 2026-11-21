package com.collabboard.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {
    private static final long WINDOW_MS = 60_000;
    private static final int MAX_BUCKETS = 10_000;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !"POST".equals(request.getMethod()) || limitFor(request.getRequestURI()) == 0;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        int limit = limitFor(request.getRequestURI());
        String key = request.getRemoteAddr() + ':' + request.getRequestURI();
        long now = System.currentTimeMillis();
        Bucket bucket = buckets.computeIfAbsent(key, ignored -> new Bucket(now));
        if (!bucket.allow(now, limit)) {
            response.setStatus(429);
            response.setHeader("Retry-After", "60");
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Too many requests. Try again shortly.\"}");
            return;
        }
        if (buckets.size() > MAX_BUCKETS) buckets.entrySet().removeIf(entry -> now - entry.getValue().startedAt > WINDOW_MS);
        chain.doFilter(request, response);
    }

    private int limitFor(String path) {
        return switch (path) {
            case "/api/auth/login" -> 10;
            case "/api/auth/signup", "/api/auth/password/forgot" -> 5;
            case "/api/auth/password/reset" -> 10;
            default -> 0;
        };
    }

    private static final class Bucket {
        private long startedAt;
        private int count;

        private Bucket(long startedAt) { this.startedAt = startedAt; }

        private synchronized boolean allow(long now, int limit) {
            if (now - startedAt >= WINDOW_MS) { startedAt = now; count = 0; }
            return ++count <= limit;
        }
    }
}
