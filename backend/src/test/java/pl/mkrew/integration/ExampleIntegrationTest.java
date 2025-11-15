package pl.mkrew.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Example integration test using Testcontainers
 *
 * Integration tests should:
 * - Test interactions between components
 * - Use real database (via Testcontainers)
 * - Test repository layer
 * - Verify data persistence and queries
 */
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@DisplayName("Example Integration Tests with Testcontainers")
class ExampleIntegrationTest {

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

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("Should verify Testcontainers PostgreSQL is running")
    void shouldVerifyPostgresIsRunning() {
        // Assert
        assertThat(postgres.isRunning()).isTrue();
        assertThat(postgres.getDatabaseName()).isEqualTo("testdb");
    }

    @Test
    @DisplayName("Should verify TestEntityManager is available")
    void shouldVerifyEntityManagerIsAvailable() {
        // Assert
        assertThat(entityManager).isNotNull();
    }

    /*
     * Example test with actual entity (uncomment when you have entities)
     *
     * @Test
     * @DisplayName("Should save and retrieve user entity")
     * void shouldSaveAndRetrieveUser() {
     *     // Arrange
     *     User user = new User();
     *     user.setEmail("test@example.com");
     *     user.setFirstName("Jan");
     *     user.setLastName("Kowalski");
     *
     *     // Act
     *     User saved = entityManager.persistAndFlush(user);
     *     entityManager.clear();
     *     User found = entityManager.find(User.class, saved.getId());
     *
     *     // Assert
     *     assertThat(found).isNotNull();
     *     assertThat(found.getEmail()).isEqualTo("test@example.com");
     *     assertThat(found.getFirstName()).isEqualTo("Jan");
     * }
     */
}
