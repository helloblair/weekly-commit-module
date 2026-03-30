package com.pa.weeklycommit.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Base64;
import java.util.List;

/**
 * Extracts user identity from the Authorization Bearer token.
 *
 * In production the host app provides a signed JWT; this filter decodes
 * the payload to extract userId and roles. For development, it also
 * accepts a plain Base64-encoded JSON payload (unsigned) so the frontend
 * can authenticate without a full OAuth flow.
 *
 * Expected JWT payload claims:
 *   sub  - user UUID
 *   role - "USER" | "MANAGER" | "ADMIN"
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ") && header.length() > 7) {
            String token = header.substring(7);
            try {
                // Decode the payload section of the JWT (second segment)
                String[] parts = token.split("\\.");
                String payloadJson;
                if (parts.length >= 2) {
                    payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]));
                } else {
                    // Fall back to treating the entire token as Base64 JSON
                    payloadJson = new String(Base64.getUrlDecoder().decode(token));
                }

                // Minimal JSON parsing — avoids adding a Jackson dependency to the filter
                String userId = extractJsonField(payloadJson, "sub");
                String role = extractJsonField(payloadJson, "role");

                if (userId != null) {
                    String authority = "ROLE_" + (role != null ? role.toUpperCase() : "USER");
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(
                                    userId,
                                    null,
                                    List.of(new SimpleGrantedAuthority(authority))
                            );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (IllegalArgumentException e) {
                // Invalid token format — continue without authentication
            }
        }

        filterChain.doFilter(request, response);
    }

    private static String extractJsonField(String json, String field) {
        String key = "\"" + field + "\"";
        int idx = json.indexOf(key);
        if (idx < 0) return null;
        int colon = json.indexOf(':', idx + key.length());
        if (colon < 0) return null;
        int start = json.indexOf('"', colon + 1);
        if (start < 0) return null;
        int end = json.indexOf('"', start + 1);
        if (end < 0) return null;
        return json.substring(start + 1, end);
    }
}
