package com.example.flowdesk_be.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // (1) Lấy token từ header
        String token = extractTokenFromRequest(request);

        // (2) Nếu có token thì xử lý
        if (StringUtils.hasText(token)) {
            try {
                // (3) Đọc email từ token
                String email = jwtUtil.extractEmail(token);

                // (4) Chưa có authentication trong context thì mới xử lý
                if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                    // (5) Load user từ DB
                    UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                    // (6) Validate token
                    if (jwtUtil.validateToken(token, userDetails)) {

                        // (7) Tạo authentication object
                        UsernamePasswordAuthenticationToken authToken =
                                new UsernamePasswordAuthenticationToken(
                                        userDetails,
                                        null,
                                        userDetails.getAuthorities()
                                );

                        // (8) Gắn thêm thông tin request
                        authToken.setDetails(
                                new WebAuthenticationDetailsSource().buildDetails(request)
                        );

                        // (9) Lưu vào SecurityContext
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                }
            } catch (Exception e) {
                // (10) Token lỗi → bỏ qua, request sẽ bị chặn bởi SecurityConfig
            }
        }

        // (11) Cho request đi tiếp dù có token hay không
        filterChain.doFilter(request, response);
    }

    // (12) Tách token ra khỏi header Authorization
    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // bỏ "Bearer " lấy token thật
        }
        return null;
    }
}
