package pl.mkrew.api;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Example API test using REST Assured
 *
 * API tests should:
 * - Test full HTTP request/response cycle
 * - Verify status codes, headers, and response body
 * - Test authentication and authorization
 * - Use real application context
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
@DisplayName("Example API Tests with REST Assured")
class ExampleApiTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
        .withDatabaseName("testdb")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @LocalServerPort
    private Integer port;

    @BeforeEach
    void setUp() {
        RestAssured.baseURI = "http://localhost";
        RestAssured.port = port;
    }

    @Test
    @DisplayName("Should verify actuator health endpoint is accessible")
    void shouldVerifyHealthEndpoint() {
        given()
            .accept(ContentType.JSON)
        .when()
            .get("/actuator/health")
        .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("status", equalTo("UP"));
    }

    /*
     * Example API test for user registration (uncomment when endpoint exists)
     *
     * @Test
     * @DisplayName("Should register new user successfully")
     * void shouldRegisterNewUser() {
     *     String requestBody = """
     *         {
     *             "email": "test@example.com",
     *             "password": "SecureP@ssw0rd123!",
     *             "firstName": "Jan",
     *             "lastName": "Kowalski",
     *             "bloodType": "A+"
     *         }
     *         """;
     *
     *     given()
     *         .contentType(ContentType.JSON)
     *         .body(requestBody)
     *     .when()
     *         .post("/api/auth/register")
     *     .then()
     *         .statusCode(201)
     *         .contentType(ContentType.JSON)
     *         .body("email", equalTo("test@example.com"))
     *         .body("firstName", equalTo("Jan"))
     *         .body("id", notNullValue());
     * }
     *
     * @Test
     * @DisplayName("Should return 400 for invalid registration data")
     * void shouldReturnBadRequestForInvalidData() {
     *     String requestBody = """
     *         {
     *             "email": "invalid-email",
     *             "password": "weak"
     *         }
     *         """;
     *
     *     given()
     *         .contentType(ContentType.JSON)
     *         .body(requestBody)
     *     .when()
     *         .post("/api/auth/register")
     *     .then()
     *         .statusCode(400)
     *         .body("errors", hasSize(greaterThan(0)));
     * }
     *
     * @Test
     * @DisplayName("Should authenticate user and return JWT token")
     * void shouldAuthenticateUser() {
     *     String requestBody = """
     *         {
     *             "email": "test@example.com",
     *             "password": "SecureP@ssw0rd123!"
     *         }
     *         """;
     *
     *     given()
     *         .contentType(ContentType.JSON)
     *         .body(requestBody)
     *     .when()
     *         .post("/api/auth/login")
     *     .then()
     *         .statusCode(200)
     *         .contentType(ContentType.JSON)
     *         .body("token", notNullValue())
     *         .body("email", equalTo("test@example.com"));
     * }
     */
}
