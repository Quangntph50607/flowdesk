package com.example.flowdesk_be.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

  private static final String BEARER_SCHEME = "bearerAuth";

  @Bean
  public OpenAPI openAPI() {
    return new OpenAPI()
        .info(new Info()
            .title("Flowdesk API")
            .description("""
                ## Flowdesk Backend API

                ### Phân quyền
                | Role | Mô tả |
                |------|-------|
                | `SUPER_ADMIN` | Quản trị toàn hệ thống — full quyền |
                | `ADMIN` | Quản trị workspace cha được phân, tạo/quản lý AGENT |
                | `AGENT` | Nhân viên thuộc chi nhánh cụ thể |

                ### Cách sử dụng
                1. Đăng nhập tại `POST /api/auth/login` để lấy `accessToken`
                2. Click **Authorize** ở góc trên phải, nhập `Bearer <accessToken>`
                3. Gọi các API cần thiết
                """)
            .version("1.0.0")
            .contact(new Contact()
                .name("Flowdesk Team")
                .email("superadmin@flowdesk.vn")))
        .servers(List.of(
            new Server().url("http://localhost:8080").description("Local Development")))
        // Khai báo scheme Bearer JWT
        .components(new Components()
            .addSecuritySchemes(BEARER_SCHEME,
                new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("Nhập access token lấy từ /api/auth/login")))
        // Áp dụng Bearer auth mặc định cho tất cả endpoint
        .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME));
  }
}
