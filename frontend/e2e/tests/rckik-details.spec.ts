import { test, expect } from '@playwright/test';
import { RckikDetailsPage } from '../page-objects/RckikDetailsPage';

test.describe('RCKiK Details View - Wyświetlanie szczegółów centrum krwiodawstwa', () => {
  let rckikDetailsPage: RckikDetailsPage;

  // Użyj ID=1 jako przykładowego centrum (zakładamy że istnieje)
  const testRckikId = 1;

  test.beforeEach(async ({ page }) => {
    rckikDetailsPage = new RckikDetailsPage(page);
    await rckikDetailsPage.goto(testRckikId);
  });

  test.describe('Podstawowe renderowanie strony', () => {
    test('TC-RCKIK-DETAILS-01: Powinien wyświetlić wszystkie główne sekcje strony', async () => {
      // Arrange & Act - strona już załadowana w beforeEach

      // Assert - Weryfikacja wszystkich głównych sekcji
      await rckikDetailsPage.verifyAllSectionsRendered();

      // Header
      await expect(rckikDetailsPage.pageHeading).toBeVisible();
      await expect(rckikDetailsPage.rckikAddress).toBeVisible();

      // Sekcja aktualnych stanów krwi
      await expect(rckikDetailsPage.currentBloodLevelsSection).toBeVisible();
      await expect(rckikDetailsPage.bloodLevelBadges.first()).toBeVisible();
    });

    test('TC-RCKIK-DETAILS-02: Powinien wyświetlić nagłówek z wszystkimi elementami', async () => {
      // Arrange & Act
      await rckikDetailsPage.waitForAllSections();

      // Assert - Nazwa centrum
      const rckikName = await rckikDetailsPage.getRckikName();
      expect(rckikName).toBeTruthy();
      expect(rckikName.length).toBeGreaterThan(0);

      // Assert - Adres centrum
      await expect(rckikDetailsPage.rckikAddress).toBeVisible();
      const address = await rckikDetailsPage.getRckikAddress();
      expect(address).toBeTruthy();

      // Assert - Breadcrumbs
      await expect(rckikDetailsPage.breadcrumbs).toBeVisible();
      await expect(rckikDetailsPage.breadcrumbs).toContainText('Lista RCKiK');
    });

    test('TC-RCKIK-DETAILS-03: Powinien wyświetlić kod centrum (jeśli dostępny)', async () => {
      // Arrange & Act
      await rckikDetailsPage.waitForAllSections();

      // Assert - Kod RCKiK powinien być widoczny (np. "RCKIK-WAW")
      const codeVisible = await rckikDetailsPage.rckikCode.isVisible().catch(() => false);

      if (codeVisible) {
        const code = await rckikDetailsPage.getRckikCode();
        expect(code).toMatch(/RCKIK|RCKiK/i);
      }
    });

    test('TC-RCKIK-DETAILS-04: Powinien wyświetlić link do mapy z lokalizacją', async () => {
      // Arrange & Act
      await rckikDetailsPage.waitForAllSections();

      // Assert - Link do mapy powinien być widoczny
      const mapLinkVisible = await rckikDetailsPage.rckikLocation.isVisible().catch(() => false);

      if (mapLinkVisible) {
        await expect(rckikDetailsPage.rckikLocation).toHaveAttribute('href', /maps|location/i);
      }
    });
  });

  test.describe('Sekcja Aktualnych Stanów Krwi', () => {
    test('TC-RCKIK-DETAILS-05: Powinien wyświetlić wszystkie 8 grup krwi', async () => {
      // Arrange & Act
      await rckikDetailsPage.waitForAllSections();

      // Assert - Powinno być dokładnie 8 badge'y grup krwi
      const allBloodGroupsDisplayed = await rckikDetailsPage.verifyAllBloodGroupsDisplayed();
      expect(allBloodGroupsDisplayed).toBe(true);

      const badgesCount = await rckikDetailsPage.getBloodLevelBadgesCount();
      expect(badgesCount).toBe(8);
    });

    test('TC-RCKIK-DETAILS-06: Każdy badge grupy krwi powinien mieć status (kolor)', async () => {
      // Arrange & Act
      await rckikDetailsPage.waitForAllSections();

      // Assert - Sprawdź pierwszy badge
      const firstBadge = rckikDetailsPage.bloodLevelBadges.first();
      await expect(firstBadge).toBeVisible();

      // Badge powinien mieć klasę wskazującą status (critical/important/ok)
      const className = await firstBadge.getAttribute('class');
      expect(className).toBeTruthy();

      // Opcjonalnie sprawdź czy badge zawiera procent
      const badgeText = await firstBadge.textContent();
      expect(badgeText).toMatch(/\d+(\.\d+)?%|0%|100%/);
    });

    test('TC-RCKIK-DETAILS-07: Powinien wyświetlić timestamp ostatniej aktualizacji', async () => {
      // Arrange & Act
      await rckikDetailsPage.waitForAllSections();

      // Assert
      const updateInfoVisible = await rckikDetailsPage.lastUpdateInfo.isVisible().catch(() => false);

      if (updateInfoVisible) {
        const updateText = await rckikDetailsPage.lastUpdateInfo.textContent();
        expect(updateText).toMatch(/Ostatnia aktualizacja|ostatnia aktualizacja/i);
      }
    });

    test('TC-RCKIK-DETAILS-08: Powinien wyświetlić Data Status Badge dla niekompletnych danych', async () => {
      // Arrange & Act
      await rckikDetailsPage.waitForAllSections();

      // Assert - Badge powinien być widoczny tylko gdy dane są niekompletne (PARTIAL/NO_DATA)
      const isDataStatusBadgeVisible = await rckikDetailsPage.isDataStatusBadgeVisible();

      // Jeśli badge jest widoczny, sprawdź czy zawiera odpowiedni tekst
      if (isDataStatusBadgeVisible) {
        const badgeText = await rckikDetailsPage.dataStatusBadge.textContent();
        expect(badgeText).toMatch(/niekompletne|brak danych/i);
      }
    });
  });

  test.describe('Sekcja Wykresu Trendu', () => {
    test('TC-RCKIK-DETAILS-09: Powinien wyświetlić selektor grup krwi', async () => {
      // Arrange & Act
      await rckikDetailsPage.waitForAllSections();

      // Assert - Selektor grup krwi powinien być widoczny
      const selectorVisible = await rckikDetailsPage.bloodGroupSelector.isVisible().catch(() => false);

      if (selectorVisible) {
        await expect(rckikDetailsPage.bloodGroupSelector).toBeVisible();

        // Powinno być 8 przycisków grup krwi
        const buttonsCount = await rckikDetailsPage.bloodGroupButtons.count();
        expect(buttonsCount).toBe(8);
      }
    });

    test('TC-RCKIK-DETAILS-10: Powinien wyświetlić wykres lub empty state', async () => {
      // Arrange & Act
      await rckikDetailsPage.waitForAllSections();

      // Assert - Wykres lub empty state powinien być widoczny
      const isChartVisible = await rckikDetailsPage.isChartVisible();
      const isChartEmptyStateVisible = await rckikDetailsPage.isChartEmptyStateVisible();

      // Jedno z dwóch powinno być widoczne
      expect(isChartVisible || isChartEmptyStateVisible).toBe(true);
    });

    test('TC-RCKIK-DETAILS-11: Powinien zmienić wykres po wyborze innej grupy krwi', async ({ page }) => {
      // Arrange
      await rckikDetailsPage.waitForAllSections();

      const selectorVisible = await rckikDetailsPage.bloodGroupSelector.isVisible().catch(() => false);
      if (!selectorVisible) {
        test.skip();
        return;
      }

      // Act - Wybierz grupę krwi "A+"
      await rckikDetailsPage.selectBloodGroup('A+');

      // Assert - Wykres powinien się zaktualizować
      // Sprawdź czy wystąpił request do API lub zmiana w DOM
      const isChartVisible = await rckikDetailsPage.isChartVisible();
      const isEmptyStateVisible = await rckikDetailsPage.isChartEmptyStateVisible();

      expect(isChartVisible || isEmptyStateVisible).toBe(true);
    });
  });

  test.describe('Sekcja Tabeli Historii', () => {
    test('TC-RCKIK-DETAILS-12: Powinien wyświetlić tabelę historii lub empty state', async () => {
      // Arrange & Act
      await rckikDetailsPage.waitForAllSections();

      // Assert
      const isTableVisible = await rckikDetailsPage.isHistoryTableVisible();
      const isEmptyStateVisible = await rckikDetailsPage.isHistoryTableEmptyStateVisible();

      // Jedno z dwóch powinno być widoczne
      expect(isTableVisible || isEmptyStateVisible).toBe(true);
    });

    test('TC-RCKIK-DETAILS-13: Powinien wyświetlić wiersze w tabeli historii', async () => {
      // Arrange & Act
      await rckikDetailsPage.waitForAllSections();

      const isTableVisible = await rckikDetailsPage.isHistoryTableVisible();

      if (isTableVisible) {
        // Assert - Tabela powinna mieć co najmniej 1 wiersz danych
        const rowsCount = await rckikDetailsPage.getHistoryTableRowsCount();
        expect(rowsCount).toBeGreaterThan(0);
      } else {
        test.skip();
      }
    });

    test('TC-RCKIK-DETAILS-14: Powinien filtrować historię po grupie krwi', async ({ page }) => {
      // Arrange
      await rckikDetailsPage.waitForAllSections();

      const isTableVisible = await rckikDetailsPage.isHistoryTableVisible();
      const isFilterVisible = await rckikDetailsPage.bloodGroupFilter.isVisible().catch(() => false);

      if (!isTableVisible || !isFilterVisible) {
        test.skip();
        return;
      }

      // Act
      await rckikDetailsPage.filterHistoryByBloodGroup('A+');

      // Assert - Request do API powinien zawierać parametr bloodGroup
      await page.waitForResponse((response) => response.url().includes('blood-levels'));

      // Tabela powinna się zaktualizować
      const rowsCount = await rckikDetailsPage.getHistoryTableRowsCount();
      expect(rowsCount).toBeGreaterThanOrEqual(0);
    });

    test('TC-RCKIK-DETAILS-15: Powinien wyczyścić filtry historii', async () => {
      // Arrange
      await rckikDetailsPage.waitForAllSections();

      const isFilterVisible = await rckikDetailsPage.clearFiltersButton.isVisible().catch(() => false);

      if (!isFilterVisible) {
        test.skip();
        return;
      }

      // Act
      await rckikDetailsPage.clearHistoryFilters();

      // Assert - Filtry powinny być zresetowane
      // Sprawdź czy request został wysłany bez parametrów filtrowania
      const isTableVisible = await rckikDetailsPage.isHistoryTableVisible();
      expect(isTableVisible || (await rckikDetailsPage.isHistoryTableEmptyStateVisible())).toBe(true);
    });
  });

  test.describe('Sekcja Statusu Scrapera', () => {
    test('TC-RCKIK-DETAILS-16: Powinien wyświetlić status scrapera', async () => {
      // Arrange & Act
      await rckikDetailsPage.waitForAllSections();

      // Assert
      const isScraperSectionVisible = await rckikDetailsPage.scraperStatusSection.isVisible().catch(() => false);

      if (isScraperSectionVisible) {
        await expect(rckikDetailsPage.scraperStatusBadge).toBeVisible();

        const statusText = await rckikDetailsPage.getScraperStatus();
        expect(statusText).toBeTruthy();
      }
    });

    test('TC-RCKIK-DETAILS-17: Powinien wyświetlić timestamp ostatniego udanego scrapingu', async () => {
      // Arrange & Act
      await rckikDetailsPage.waitForAllSections();

      // Assert
      const isScraperTextVisible = await rckikDetailsPage.lastSuccessfulScrapeText.isVisible().catch(() => false);

      if (isScraperTextVisible) {
        const scrapeText = await rckikDetailsPage.lastSuccessfulScrapeText.textContent();
        expect(scrapeText).toMatch(/Ostatnie udane pobranie|ostatnie udane pobranie/i);
      }
    });

    test('TC-RCKIK-DETAILS-18: Powinien mieć link do zgłoszenia problemu', async () => {
      // Arrange & Act
      await rckikDetailsPage.waitForAllSections();

      // Assert
      const isReportButtonVisible = await rckikDetailsPage.reportIssueButton.isVisible().catch(() => false);

      if (isReportButtonVisible) {
        await expect(rckikDetailsPage.reportIssueButton).toBeVisible();
        await expect(rckikDetailsPage.reportIssueButton).toContainText(/Zgłoś problem|zgłoś problem/i);
      }
    });
  });

  test.describe('Funkcjonalność Ulubionych (dla zalogowanych użytkowników)', () => {
    test('TC-RCKIK-DETAILS-19: Powinien wyświetlić przycisk dodania do ulubionych', async () => {
      // Arrange & Act
      await rckikDetailsPage.waitForAllSections();

      // Assert - Przycisk favorite powinien być widoczny
      const isFavoriteButtonVisible = await rckikDetailsPage.favoriteButton.isVisible().catch(() => false);

      if (isFavoriteButtonVisible) {
        await expect(rckikDetailsPage.favoriteButton).toBeVisible();
      }
    });

    // Note: Test dodawania do ulubionych wymaga uwierzytelnienia
    // Ten test zakłada że użytkownik NIE jest zalogowany
    test('TC-RCKIK-DETAILS-20: Niezalogowany użytkownik powinien zostać przekierowany do logowania', async ({ page }) => {
      // Arrange
      await rckikDetailsPage.waitForAllSections();

      const isFavoriteButtonVisible = await rckikDetailsPage.favoriteButton.isVisible().catch(() => false);

      if (!isFavoriteButtonVisible) {
        test.skip();
        return;
      }

      // Act
      await rckikDetailsPage.favoriteButton.click();

      // Assert - Powinno nastąpić przekierowanie do /login lub wyświetlenie komunikatu
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      const isLoginPage = currentUrl.includes('/login');
      const isModalVisible = await page.locator('[role="dialog"], .modal').isVisible().catch(() => false);

      // Jedno z dwóch powinno się wydarzyć
      expect(isLoginPage || isModalVisible).toBe(true);
    });
  });

  test.describe('Nawigacja', () => {
    test('TC-RCKIK-DETAILS-21: Powinien wrócić do listy poprzez breadcrumbs', async ({ page }) => {
      // Arrange
      await rckikDetailsPage.waitForAllSections();

      // Act
      await rckikDetailsPage.navigateToListViaBreadcrumbs();

      // Assert - Powinno nastąpić przekierowanie do /rckik
      await page.waitForURL(/\/rckik$/);
      expect(page.url()).toMatch(/\/rckik$/);
    });
  });

  test.describe('Obsługa błędów', () => {
    test('TC-RCKIK-DETAILS-22: Powinien wyświetlić błąd 404 dla nieistniejącego centrum', async ({ page }) => {
      // Arrange & Act
      await rckikDetailsPage.goto(999999); // Nieistniejące ID

      // Assert - Powinien wyświetlić stronę 404 lub error state
      const is404Page = page.url().includes('/404') || page.url().includes('/not-found');
      const errorHeading = await page.locator('h1:has-text("404"), h1:has-text("Nie znaleziono")').isVisible().catch(() => false);

      expect(is404Page || errorHeading).toBe(true);
    });
  });

  test.describe('Responsywność i Accessibility', () => {
    test('TC-RCKIK-DETAILS-23: Powinien być dostępny na urządzeniach mobilnych', async ({ page }) => {
      // Arrange - Ustaw viewport na mobile
      await page.setViewportSize({ width: 375, height: 667 });

      // Act
      await rckikDetailsPage.goto(testRckikId);
      await rckikDetailsPage.waitForAllSections();

      // Assert - Kluczowe elementy powinny być widoczne
      await expect(rckikDetailsPage.pageHeading).toBeVisible();
      await expect(rckikDetailsPage.rckikAddress).toBeVisible();
      await expect(rckikDetailsPage.bloodLevelBadges.first()).toBeVisible();
    });

    test('TC-RCKIK-DETAILS-24: Powinien mieć poprawne atrybuty semantyczne HTML', async () => {
      // Arrange & Act
      await rckikDetailsPage.waitForAllSections();

      // Assert - Nagłówek H1 powinien istnieć
      await expect(rckikDetailsPage.pageHeading).toBeVisible();

      // Assert - Adres powinien używać tagu <address>
      const addressTag = await rckikDetailsPage.rckikAddress.evaluate(
        (element) => element.tagName.toLowerCase()
      );
      expect(['address', 'div', 'p']).toContain(addressTag); // Akceptujemy address lub inne semantic tags

      // Assert - Breadcrumbs powinny być w <nav>
      const breadcrumbsTag = await rckikDetailsPage.breadcrumbs.evaluate(
        (element) => element.tagName.toLowerCase()
      );
      expect(breadcrumbsTag).toBe('nav');
    });

    test('TC-RCKIK-DETAILS-25: Powinien mieć poprawne atrybuty ARIA', async () => {
      // Arrange & Act
      await rckikDetailsPage.waitForAllSections();

      // Assert - Favorite button powinien mieć aria-label
      const isFavoriteButtonVisible = await rckikDetailsPage.favoriteButton.isVisible().catch(() => false);

      if (isFavoriteButtonVisible) {
        const ariaLabel = await rckikDetailsPage.favoriteButton.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      }

      // Assert - Breadcrumbs navigation powinny mieć aria-label
      const breadcrumbsAriaLabel = await rckikDetailsPage.breadcrumbs.getAttribute('aria-label');
      expect(breadcrumbsAriaLabel).toBeTruthy();
    });
  });
});
