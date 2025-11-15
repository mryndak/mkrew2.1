package pl.mkrew.unit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Example unit test demonstrating JUnit 5 and AssertJ usage
 *
 * Unit tests should:
 * - Test single units of code in isolation
 * - Use mocks for dependencies
 * - Be fast and independent
 * - Follow AAA pattern (Arrange, Act, Assert)
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Example Unit Tests")
class ExampleUnitTest {

    @Test
    @DisplayName("Should demonstrate basic assertion")
    void shouldDemonstrateBasicAssertion() {
        // Arrange
        String expected = "Hello, World!";

        // Act
        String actual = "Hello, World!";

        // Assert
        assertThat(actual).isEqualTo(expected);
    }

    @Test
    @DisplayName("Should demonstrate AssertJ fluent assertions")
    void shouldDemonstrateFluentAssertions() {
        // Arrange
        String text = "mkrew";

        // Assert with AssertJ
        assertThat(text)
            .isNotNull()
            .isNotEmpty()
            .hasSize(5)
            .startsWith("mk")
            .endsWith("rew")
            .contains("kre");
    }

    @Test
    @DisplayName("Should demonstrate collection assertions")
    void shouldDemonstrateCollectionAssertions() {
        // Arrange
        var bloodTypes = java.util.List.of("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-");

        // Assert
        assertThat(bloodTypes)
            .isNotEmpty()
            .hasSize(8)
            .contains("A+", "O-")
            .doesNotContain("C+")
            .startsWith("A+")
            .endsWith("O-");
    }

    @Test
    @DisplayName("Should demonstrate exception testing")
    void shouldDemonstrateExceptionTesting() {
        // Arrange & Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            throw new IllegalArgumentException("Invalid input");
        });

        // With AssertJ
        assertThatThrownBy(() -> {
            throw new IllegalArgumentException("Invalid input");
        })
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Invalid input");
    }
}
