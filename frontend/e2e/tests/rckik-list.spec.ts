import { test, expect } from '@playwright/test';
import { RckikListPage } from '../page-objects/RckikListPage';

test.describe('RCKiK List View - Wyświetlanie listy centrów krwiodawstwa', () => {
  let rckikListPage: RckikListPage;

  test.beforeEach(async ({ page }) => {
    rckikListPage = new RckikListPage(page);
    await rckikListPage.goto();
  });

  test.describe('Podstawowe renderowanie strony', () => {
    test('TC-RCKIK-LIST-01: Powinien wyświetlić wszystkie kluczowe elementy strony', async () => {
      // Arrange & Act - strona już załadowana w beforeEach

      // Assert - Weryfikacja nagłówka
      await expect(rckikListPage.pageHeading).toBeVisible();
      await expect(rckikListPage.pageHeading).toContainText(/Centra krwiodawstwa/i);

      // Assert - Weryfikacja pola wyszukiwania
      await expect(rckikListPage.searchInput).toBeVisible();

      // Assert - Weryfikacja filtrów (sort)
      await expect(rckikListPage.sortByFilter).toBeVisible();
      await expect(rckikListPage.sortOrderToggle).toBeVisible();

      // Assert - Weryfikacja liczby wyników
      await expect(rckikListPage.resultsCount).toBeVisible();

      // Assert - Weryfikacja listy kart RCKiK
      await rckikListPage.waitForRckikCards();
      const cardsCount = await rckikListPage.getRckikCardsCount();
      expect(cardsCount).toBeGreaterThan(0);
    });

    test('TC-RCKIK-LIST-02: Powinien wyświetlić kartę RCKiK z wszystkimi wymaganymi elementami', async () => {
      // Arrange & Act
      await rckikListPage.waitForRckikCards();

      // Assert - Weryfikacja elementów pierwszej karty
      const firstCard = rckikListPage.firstRckikCard;

      // Nazwa centrum
      await expect(firstCard.locator('h2, [data-testid="rckik-name"]').first()).toBeVisible();

      // Kod i miasto
      await expect(firstCard.locator('text=/RCKIK|RCKiK/i')).toBeVisible();

      // Adres
      await expect(firstCard.locator('address, [data-testid="rckik-address"]')).toBeVisible();

      // Badge'e grup krwi (powinno być 8)
      const bloodBadgesCount = await rckikListPage.getBloodLevelBadgesCount(0);
      expect(bloodBadgesCount).toBe(8);

      // Timestamp ostatniej aktualizacji
      await expect(firstCard.locator('time, [data-testid="last-update"], text=/Ostatnia aktualizacja/i')).toBeVisible();
    });

    test('TC-RCKIK-LIST-03: Powinien wyświetlić badge dla każdej grupy krwi', async () => {
      // Arrange & Act
      await rckikListPage.waitForRckikCards();

      // Assert - Weryfikacja wszystkich 8 grup krwi
      const bloodGroups = ['0+', '0-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

      for (const bloodGroup of bloodGroups) {
        const isVisible = await rckikListPage.isBloodGroupVisible(0, bloodGroup);
        expect(isVisible).toBe(true);
      }
    });

    test('TC-RCKIK-LIST-04: Powinien wyświetlić paginację gdy jest więcej niż 20 wyników', async () => {
      // Arrange & Act
      await rckikListPage.waitForRckikCards();
      const resultsText = await rckikListPage.getResultsCountText();

      // Extract number from text like "Znaleziono 45 centrów"
      const match = resultsText.match(/\d+/);
      const totalResults = match ? parseInt(match[0]) : 0;

      // Assert
      if (totalResults > 20) {
        await expect(rckikListPage.paginationNext).toBeVisible();
        await expect(rckikListPage.paginationPageNumbers.first()).toBeVisible();
      }
    });
  });

  test.describe('Funkcjonalność wyszukiwania', () => {
    test('TC-RCKIK-LIST-05: Powinien filtrować listę przy wpisaniu nazwy w pole wyszukiwania', async ({ page }) => {
      // Arrange
      await rckikListPage.waitForRckikCards();
      const firstCardName = await rckikListPage.getRckikCardName(0);
      const searchQuery = firstCardName.split(' ')[0]; // Pierwszy wyraz z nazwy

      // Act
      await rckikListPage.searchByName(searchQuery);

      // Assert - URL powinien zawierać parametr search
      const urlContainsSearch = await rckikListPage.verifyUrlParam('search', searchQuery);
      expect(urlContainsSearch).toBe(true);

      // Assert - Wszystkie wyniki powinny zawierać wyszukiwaną frazę
      const cardsCount = await rckikListPage.getRckikCardsCount();
      expect(cardsCount).toBeGreaterThan(0);

      const firstResultName = await rckikListPage.getRckikCardName(0);
      expect(firstResultName.toLowerCase()).toContain(searchQuery.toLowerCase());
    });

    test('TC-RCKIK-LIST-06: Powinien wyczyścić wyszukiwanie po kliknięciu przycisku Clear', async () => {
      // Arrange
      await rckikListPage.searchByName('Warszawa');
      await rckikListPage.page.waitForLoadState('networkidle');

      // Act
      await rckikListPage.clearSearch();

      // Assert - URL nie powinien zawierać parametru search
      const url = new URL(rckikListPage.getCurrentUrl());
      expect(url.searchParams.has('search')).toBe(false);
    });

    test('TC-RCKIK-LIST-07: Powinien wyświetlić EmptyState gdy nie znaleziono wyników', async () => {
      // Arrange & Act
      await rckikListPage.searchByName('XYZ123NonExistentCenter');

      // Assert
      const isEmptyStateVisible = await rckikListPage.isEmptyStateVisible();
      expect(isEmptyStateVisible).toBe(true);

      // Assert - Powinien być widoczny przycisk Reset filtrów
      await expect(rckikListPage.resetFiltersButton).toBeVisible();
    });
  });

  test.describe('Funkcjonalność filtrowania', () => {
    // City filter not implemented yet - see README-RCKIK-IMPLEMENTATION.md
    test.skip('TC-RCKIK-LIST-08: Powinien filtrować listę po wybraniu miasta', async ({ page }) => {
      // TODO: Implement when city filter is added to FiltersPanel component
      // Tracking: US-025 - Add city filter functionality
    });

    test('TC-RCKIK-LIST-09: Powinien zresetować wszystkie filtry po kliknięciu Reset', async () => {
      // Arrange - Zastosuj filtry
      await rckikListPage.searchByName('Warszawa');
      await rckikListPage.page.waitForTimeout(700);

      // Act
      await rckikListPage.resetFilters();

      // Assert - URL nie powinien zawierać parametrów filtrowania
      const url = new URL(rckikListPage.getCurrentUrl());
      expect(url.searchParams.has('search')).toBe(false);
      expect(url.searchParams.has('city')).toBe(false);

      // Assert - Lista powinna pokazywać wszystkie wyniki
      await rckikListPage.waitForRckikCards();
      const cardsCount = await rckikListPage.getRckikCardsCount();
      expect(cardsCount).toBeGreaterThan(0);
    });
  });

  test.describe('Funkcjonalność sortowania', () => {
    test('TC-RCKIK-LIST-10: Powinien zmienić sortowanie po wybraniu opcji', async () => {
      // Arrange
      await rckikListPage.waitForRckikCards();

      // Act
      await rckikListPage.sortBy('city');

      // Assert - URL powinien zawierać parametr sortBy
      const urlContainsSortBy = await rckikListPage.verifyUrlParam('sortBy', 'city');
      expect(urlContainsSortBy).toBe(true);
    });

    test('TC-RCKIK-LIST-11: Powinien przełączyć kierunek sortowania (ASC/DESC)', async () => {
      // Arrange
      await rckikListPage.waitForRckikCards();

      // Act
      await rckikListPage.toggleSortOrder();

      // Assert - URL powinien zawierać parametr sortOrder
      const url = new URL(rckikListPage.getCurrentUrl());
      const sortOrder = url.searchParams.get('sortOrder');
      expect(['ASC', 'DESC']).toContain(sortOrder);
    });
  });

  test.describe('Funkcjonalność paginacji', () => {
    test('TC-RCKIK-LIST-12: Powinien przejść do następnej strony po kliknięciu Next', async () => {
      // Arrange
      await rckikListPage.waitForRckikCards();

      // Sprawdź czy przycisk Next jest aktywny
      const isNextEnabled = await rckikListPage.paginationNext.isEnabled();
      if (!isNextEnabled) {
        test.skip();
        return;
      }

      // Act
      await rckikListPage.goToNextPage();

      // Assert - URL powinien zawierać page=1
      const urlContainsPage = await rckikListPage.verifyUrlParam('page', '1');
      expect(urlContainsPage).toBe(true);

      // Assert - Lista powinna się zaktualizować
      await rckikListPage.waitForRckikCards();
      const cardsCount = await rckikListPage.getRckikCardsCount();
      expect(cardsCount).toBeGreaterThan(0);
    });

    test('TC-RCKIK-LIST-13: Powinien zmienić rozmiar strony po wybraniu opcji', async () => {
      // Arrange
      await rckikListPage.waitForRckikCards();

      // Act
      await rckikListPage.selectPageSize(10);

      // Assert - URL powinien zawierać size=10
      const urlContainsSize = await rckikListPage.verifyUrlParam('size', '10');
      expect(urlContainsSize).toBe(true);

      // Assert - Lista powinna pokazywać maksymalnie 10 elementów
      const cardsCount = await rckikListPage.getRckikCardsCount();
      expect(cardsCount).toBeLessThanOrEqual(10);
    });

    test('TC-RCKIK-LIST-14: Przycisk Previous powinien być wyłączony na pierwszej stronie', async () => {
      // Arrange & Act
      await rckikListPage.waitForRckikCards();

      // Upewnij się, że jesteśmy na pierwszej stronie
      const url = new URL(rckikListPage.getCurrentUrl());
      if (!url.searchParams.has('page') || url.searchParams.get('page') === '0') {
        // Assert
        const isPreviousDisabled = await rckikListPage.paginationPrevious.isDisabled();
        expect(isPreviousDisabled).toBe(true);
      }
    });
  });

  test.describe('Nawigacja do szczegółów', () => {
    test('TC-RCKIK-LIST-15: Powinien nawigować do szczegółów po kliknięciu karty RCKiK', async ({ page }) => {
      // Arrange
      await rckikListPage.waitForRckikCards();

      // Act
      await rckikListPage.clickFirstRckikCard();

      // Assert - URL powinien zawierać /rckik/[id]
      await page.waitForURL(/\/rckik\/\d+/);
      expect(page.url()).toMatch(/\/rckik\/\d+/);
    });

    test('TC-RCKIK-LIST-16: Powinien nawigować do szczegółów konkretnego centrum po nazwie', async ({ page }) => {
      // Arrange
      await rckikListPage.waitForRckikCards();
      const firstCardName = await rckikListPage.getRckikCardName(0);

      // Act
      await rckikListPage.clickRckikCardByName(firstCardName);

      // Assert
      await page.waitForURL(/\/rckik\/\d+/);
      expect(page.url()).toMatch(/\/rckik\/\d+/);
    });
  });

  test.describe('Responsywność i Accessibility', () => {
    test('TC-RCKIK-LIST-17: Powinien być dostępny na urządzeniach mobilnych', async ({ page }) => {
      // Arrange - Ustaw viewport na mobile
      await page.setViewportSize({ width: 375, height: 667 });

      // Act
      await rckikListPage.goto();
      await rckikListPage.waitForRckikCards();

      // Assert - Kluczowe elementy powinny być widoczne
      await expect(rckikListPage.pageHeading).toBeVisible();
      await expect(rckikListPage.searchInput).toBeVisible();
      await expect(rckikListPage.firstRckikCard).toBeVisible();
    });

    test('TC-RCKIK-LIST-18: Powinien mieć poprawne atrybuty ARIA dla accessibility', async () => {
      // Arrange & Act
      await rckikListPage.waitForRckikCards();

      // Assert - Weryfikacja kluczowych atrybutów ARIA
      const searchInputRole = await rckikListPage.searchInput.getAttribute('role');
      const searchInputLabel = await rckikListPage.searchInput.getAttribute('aria-label');

      // Input powinien mieć label lub aria-label
      expect(searchInputRole !== null || searchInputLabel !== null).toBe(true);

      // Paginacja powinna mieć navigation role
      const paginationNav = rckikListPage.page.locator('nav[aria-label*="Pagination"], nav[aria-label*="Paginacja"]');
      if (await paginationNav.count() > 0) {
        await expect(paginationNav.first()).toBeVisible();
      }
    });
  });

  test.describe('Shareable URLs - Parametry w URL', () => {
    test('TC-RCKIK-LIST-19: Powinien zachować wszystkie parametry filtrowania w URL', async () => {
      // Arrange & Act
      await rckikListPage.searchByName('Warszawa');
      await rckikListPage.page.waitForTimeout(700);
      await rckikListPage.sortBy('name');

      // Assert - URL powinien zawierać wszystkie parametry
      const url = new URL(rckikListPage.getCurrentUrl());
      expect(url.searchParams.get('search')).toBe('Warszawa');
      expect(url.searchParams.get('sortBy')).toBe('name');
    });

    test('TC-RCKIK-LIST-20: Powinien załadować stronę z parametrami z URL', async ({ page }) => {
      // Arrange & Act - Navigate directly to URL with params
      await page.goto('/rckik?search=Warszawa&page=0&sortBy=name');
      await rckikListPage.waitForRckikCards();

      // Assert - Search input powinien być wypełniony
      const searchInputValue = await rckikListPage.searchInput.inputValue();
      expect(searchInputValue).toBe('Warszawa');

      // Assert - Wyniki powinny być przefiltrowane
      const cardsCount = await rckikListPage.getRckikCardsCount();
      expect(cardsCount).toBeGreaterThan(0);
    });
  });
});
