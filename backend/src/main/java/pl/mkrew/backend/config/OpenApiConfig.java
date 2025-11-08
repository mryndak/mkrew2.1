package pl.mkrew.backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.port:8080}")
    private String serverPort;

    @Bean
    public OpenAPI customOpenAPI() {
        // Define JWT Security Scheme
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("mkrew API")
                        .version("1.0.0")
                        .description("""
                                REST API for mkrew - Blood Donation Center Status Tracker

                                ## Overview
                                mkrew helps blood donors track blood supply levels at Polish Regional Blood Donation Centers (RCKiK).

                                ## Authentication
                                Most endpoints require JWT authentication. To authenticate:
                                1. Register: POST /api/v1/auth/register
                                2. Verify email: GET /api/v1/auth/verify-email?token={token}
                                3. Login: POST /api/v1/auth/login
                                4. Use the returned access token in the Authorization header: `Bearer {token}`

                                ## Features
                                - User authentication with email verification
                                - Password reset functionality
                                - Blood donation center status tracking
                                - Personal donation diary
                                - Notifications for critical blood levels
                                """)
                        .contact(new Contact()
                                .name("mkrew Team")
                                .email("contact@mkrew.pl")
                                .url("https://mkrew.pl"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort)
                                .description("Local Development Server"),
                        new Server()
                                .url("https://api.mkrew.pl")
                                .description("Production Server (GCP)")
                ))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Enter JWT token obtained from /api/v1/auth/login endpoint")));
    }
}
