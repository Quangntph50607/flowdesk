package com.example.flowdesk_be.config;

import com.example.flowdesk_be.security.JwtAuthFilter;
import com.example.flowdesk_be.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

  private final JwtAuthFilter jwtAuthFilter;
  private final UserDetailsServiceImpl userDetailsService;

  // (1) Cấu hình filter chain — rule chính của Security
  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        // (2) Tắt CSRF
        .csrf(AbstractHttpConfigurer::disable)

        // (3) Bật CORS
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))

        // (4) Quy định endpoint nào cần auth, endpoint nào không
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**").permitAll()
            // Swagger UI
            .requestMatchers(
                "/swagger-ui/**",
                "/swagger-ui.html",
                "/v3/api-docs/**",
                "/v3/api-docs.yaml")
            .permitAll()
            // Chỉ SUPER_ADMIN mới được gọi /api/admin/**
            .requestMatchers("/api/admin/**").hasRole("SUPER_ADMIN")
            // SUPER_ADMIN và ADMIN được gọi /api/workspace/**
            .requestMatchers("/api/workspace/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "USER")
            // Mọi user đã đăng nhập được gọi /api/me
            .requestMatchers("/api/me").authenticated()
            .anyRequest().authenticated())

        // (5) Không dùng session
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

        // (6) Gắn authentication provider
        .authenticationProvider(authenticationProvider())

        // (7) Gắn JWT filter vào trước filter mặc định
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  // (7) Provider xử lý login: lấy user từ DB và so sánh password
  @Bean
  public AuthenticationProvider authenticationProvider() {
    DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
    provider.setPasswordEncoder(passwordEncoder());
    return provider;
  }

  // (8) AuthenticationManager — dùng trong AuthService để trigger login
  @Bean
  public AuthenticationManager authenticationManager(
      AuthenticationConfiguration config) throws Exception {
    return config.getAuthenticationManager();
  }

  // (9) BCrypt encoder — mã hóa password
  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  // (10) CORS — cho phép FE localhost:3000 gọi API
  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("http://localhost:3000"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }
}
