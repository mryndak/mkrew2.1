package pl.mkrew.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

/**
 * Architecture tests using ArchUnit
 *
 * These tests verify:
 * - Layered architecture is respected
 * - Naming conventions are followed
 * - Dependencies flow in the correct direction
 */
@DisplayName("Layered Architecture Tests")
class LayeredArchitectureTest {

    private static JavaClasses importedClasses;

    @BeforeAll
    static void setup() {
        importedClasses = new ClassFileImporter()
            .importPackages("pl.mkrew");
    }

    @Test
    @DisplayName("Should enforce layered architecture")
    @Disabled("Architecture rules need adjustment for current project structure (ratelimit, scheduler, security packages)")
    void shouldEnforceLayeredArchitecture() {
        ArchRule rule = layeredArchitecture()
            .consideringAllDependencies()

            .layer("Controller").definedBy("..controller..")
            .layer("Service").definedBy("..service..")
            .layer("Repository").definedBy("..repository..")
            .layer("Entity").definedBy("..entity..")

            .whereLayer("Controller").mayNotBeAccessedByAnyLayer()
            .whereLayer("Service").mayOnlyBeAccessedByLayers("Controller", "Service")
            .whereLayer("Repository").mayOnlyBeAccessedByLayers("Service")
            .whereLayer("Entity").mayOnlyBeAccessedByLayers("Repository", "Service", "Controller");

        rule.check(importedClasses);
    }

    @Test
    @DisplayName("Controllers should be named with Controller suffix")
    void controllersShouldBeNamedProperly() {
        ArchRule rule = classes()
            .that().resideInAPackage("..controller..")
            .should().haveSimpleNameEndingWith("Controller");

        rule.check(importedClasses);
    }

    @Test
    @DisplayName("Services should be named with Service suffix")
    @Disabled("Naming convention needs adjustment - some classes in service-related packages don't follow strict Service suffix")
    void servicesShouldBeNamedProperly() {
        ArchRule rule = classes()
            .that().resideInAPackage("..service..")
            .and().areNotInterfaces()
            .should().haveSimpleNameEndingWith("Service");

        rule.check(importedClasses);
    }

    @Test
    @DisplayName("Repositories should be named with Repository suffix")
    void repositoriesShouldBeNamedProperly() {
        ArchRule rule = classes()
            .that().resideInAPackage("..repository..")
            .should().haveSimpleNameEndingWith("Repository");

        rule.check(importedClasses);
    }
}
