import { test, expect } from '@playwright/test';
import { RckikListPage } from '../page-objects/RckikListPage';
import { RckikDetailsPage } from '../page-objects/RckikDetailsPage';

test.describe('RCKiK User Flow - Pełna ścieżka użytkownika', () => {
  let rckikListPage: RckikListPage;
  let rckikDetailsPage: RckikDetailsPage;

  test.beforeEach(async ({ page }) => {
    rckikListPage = new RckikListPage(page);
    rckikDetailsPage = new RckikDetailsPage(page);
  });

  test.describe('Scenariusz 1: Przeglądanie listy i nawigacja do szczegółów', () => {
    test('TC-FLOW-01: Użytkownik powinien móc przejść z listy do szczegółów centrum i z powrotem', async ({ page }) => {
      // Arrange - Nawigacja do listy
      await rckikListPage.goto();
      await rckikListPage.waitForRckikCards();

      // Act 1 - Zapisz nazwę pierwszego centrum
      const firstCenterName = await rckikListPage.getRckikCardName(0);
      expect(firstCenterName).toBeTruthy();

      // Act 2 - Kliknij na pierwszą kartę centrum
      await rckikListPage.clickFirstRckikCard();

      // Assert 1 - Weryfikacja nawigacji do szczegółów
      await page.waitForURL(/\/rckik\/\d+/);
      expect(page.url()).toMatch(/\/rckik\/\d+/);

      // Assert 2 - Weryfikacja że nazwa centrum się zgadza
      await rckikDetailsPage.waitForAllSections();
      const detailsCenterName = await rckikDetailsPage.getRckikName();
      expect(detailsCenterName).toContain(firstCenterName.split(' ').slice(0, 3).join(' ')); // Porównaj pierwsze słowa

      // Act 3 - Powrót do listy przez breadcrumbs
      await rckikDetailsPage.navigateToListViaBreadcrumbs();

      // Assert 3 - Weryfikacja powrotu do listy
      await page.waitForURL(/\/rckik$/);
      expect(page.url()).toMatch(/\/rckik$/);

      // Assert 4 - Weryfikacja że lista się załadowała
      await rckikListPage.waitForRckikCards();
      const cardsCount = await rckikListPage.getRckikCardsCount();
      expect(cardsCount).toBeGreaterThan(0);
    });

    test('TC-FLOW-02: Użytkownik powinien móc otworzyć centrum w nowej karcie', async ({ page, context }) => {
      // Arrange
      await rckikListPage.goto();
      await rckikListPage.waitForRckikCards();

      // Act - Kliknij z Ctrl (Windows/Linux) lub Cmd (Mac) aby otworzyć w nowej karcie
      const firstCard = rckikListPage.firstRckikCard;

      // Otwórz link w nowej karcie
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        firstCard.click({ modifiers: ['Control'] }), // Ctrl+Click
      ]);

      await newPage.waitForLoadState();

      // Assert - Nowa karta powinna być otwarta ze szczegółami
      expect(newPage.url()).toMatch(/\/rckik\/\d+/);

      // Assert - Oryginalna strona powinna pozostać na liście
      expect(page.url()).toMatch(/\/rckik$/);

      await newPage.close();
    });
  });

  test.describe('Scenariusz 2: Wyszukiwanie i przeglądanie wyników', () => {
    test('TC-FLOW-03: Użytkownik powinien móc wyszukać centrum, otworzyć szczegóły i wrócić do wyników wyszukiwania', async ({ page }) => {
      // Arrange
      await rckikListPage.goto();
      await rckikListPage.waitForRckikCards();

      // Act 1 - Wyszukaj centrum "Warszawa"
      await rckikListPage.searchByName('Warszawa');

      // Assert 1 - Wyniki powinny być przefiltrowane
      const resultsText = await rckikListPage.getResultsCountText();
      expect(resultsText).toContain('Znaleziono');

      // Assert 2 - URL powinien zawierać parametr search
      const urlHasSearch = await rckikListPage.verifyUrlParam('search', 'Warszawa');
      expect(urlHasSearch).toBe(true);

      // Act 2 - Otwórz pierwsze centrum z wyników
      const searchResultName = await rckikListPage.getRckikCardName(0);
      await rckikListPage.clickFirstRckikCard();

      // Assert 3 - Nawigacja do szczegółów
      await page.waitForURL(/\/rckik\/\d+/);

      // Assert 4 - Nazwa centrum zawiera wyszukiwaną frazę
      await rckikDetailsPage.waitForAllSections();
      const detailsName = await rckikDetailsPage.getRckikName();
      expect(detailsName.toLowerCase()).toContain('warszawa');

      // Act 3 - Powrót do listy
      await page.goBack();

      // Assert 5 - Wyszukiwanie powinno być zachowane
      await page.waitForURL(/\/rckik\?.*search=Warszawa/);
      expect(page.url()).toContain('search=Warszawa');

      // Assert 6 - Wyniki wyszukiwania powinny być nadal widoczne
      await rckikListPage.waitForRckikCards();
      const cardsCount = await rckikListPage.getRckikCardsCount();
      expect(cardsCount).toBeGreaterThan(0);
    });

    // City filter not implemented - see README-RCKIK-IMPLEMENTATION.md
    test.skip('TC-FLOW-04: Użytkownik powinien móc filtrować po mieście, otworzyć szczegóły i wrócić', async ({ page }) => {
      // TODO: Implement when city filter is added (FiltersPanel component)
      // Tracking: US-025 - Add city filter functionality
    });
  });

  test.describe('Scenariusz 3: Paginacja i nawigacja', () => {
    test('TC-FLOW-05: Użytkownik powinien móc przejść na stronę 2, otworzyć szczegóły i wrócić', async ({ page }) => {
      // Arrange
      await rckikListPage.goto();
      await rckikListPage.waitForRckikCards();

      // Sprawdź czy przycisk Next jest dostępny
      const isNextEnabled = await rckikListPage.paginationNext.isEnabled();
      if (!isNextEnabled) {
        test.skip();
        return;
      }

      // Act 1 - Przejdź na stronę 2
      await rckikListPage.goToNextPage();

      // Assert 1 - URL powinien zawierać page=1
      const urlHasPage = await rckikListPage.verifyUrlParam('page', '1');
      expect(urlHasPage).toBe(true);

      // Act 2 - Otwórz centrum ze strony 2
      await rckikListPage.waitForRckikCards();
      const page2CenterName = await rckikListPage.getRckikCardName(0);
      await rckikListPage.clickFirstRckikCard();

      // Assert 2 - Nawigacja do szczegółów
      await page.waitForURL(/\/rckik\/\d+/);

      // Act 3 - Powrót do listy
      await page.goBack();

      // Assert 3 - Powinniśmy wrócić na stronę 2
      await page.waitForURL(/\/rckik\?.*page=1/);
      expect(page.url()).toContain('page=1');

      // Assert 4 - Lista ze strony 2 powinna być widoczna
      await rckikListPage.waitForRckikCards();
      const returnedCenterName = await rckikListPage.getRckikCardName(0);
      expect(returnedCenterName).toBe(page2CenterName);
    });
  });

  test.describe('Scenariusz 4: Szczegóły centrum - wszystkie sekcje', () => {
    test('TC-FLOW-06: Użytkownik powinien móc przeglądać wszystkie sekcje szczegółów centrum', async ({ page }) => {
      // Arrange
      await rckikListPage.goto();
      await rckikListPage.waitForRckikCards();

      // Act 1 - Otwórz szczegóły centrum
      await rckikListPage.clickFirstRckikCard();
      await page.waitForURL(/\/rckik\/\d+/);
      await rckikDetailsPage.waitForAllSections();

      // Assert 1 - Weryfikacja sekcji nagłówka
      const centerName = await rckikDetailsPage.getRckikName();
      expect(centerName).toBeTruthy();

      const address = await rckikDetailsPage.getRckikAddress();
      expect(address).toBeTruthy();

      // Assert 2 - Weryfikacja sekcji stanów krwi
      const allBloodGroupsDisplayed = await rckikDetailsPage.verifyAllBloodGroupsDisplayed();
      expect(allBloodGroupsDisplayed).toBe(true);

      // Assert 3 - Weryfikacja sekcji wykresu (jeśli widoczna)
      const isSelectorVisible = await rckikDetailsPage.bloodGroupSelector.isVisible().catch(() => false);

      if (isSelectorVisible) {
        // Act 2 - Wybierz grupę krwi w wykresie
        await rckikDetailsPage.selectBloodGroup('A+');

        // Assert - Wykres lub empty state powinien być widoczny
        const isChartVisible = await rckikDetailsPage.isChartVisible();
        const isChartEmptyStateVisible = await rckikDetailsPage.isChartEmptyStateVisible();
        expect(isChartVisible || isChartEmptyStateVisible).toBe(true);
      }

      // Assert 4 - Weryfikacja sekcji tabeli historii (jeśli widoczna)
      const isHistoryVisible = await rckikDetailsPage.historyTableSection.isVisible().catch(() => false);

      if (isHistoryVisible) {
        const isTableVisible = await rckikDetailsPage.isHistoryTableVisible();
        const isEmptyStateVisible = await rckikDetailsPage.isHistoryTableEmptyStateVisible();
        expect(isTableVisible || isEmptyStateVisible).toBe(true);
      }

      // Assert 5 - Weryfikacja sekcji statusu scrapera (jeśli widoczna)
      const isScraperVisible = await rckikDetailsPage.scraperStatusSection.isVisible().catch(() => false);

      if (isScraperVisible) {
        await expect(rckikDetailsPage.scraperStatusBadge).toBeVisible();
      }
    });

    test('TC-FLOW-07: Użytkownik powinien móc zmienić grupy krwi w wykresie i filtrować tabelę historii', async ({ page }) => {
      // Arrange
      await rckikListPage.goto();
      await rckikListPage.waitForRckikCards();
      await rckikListPage.clickFirstRckikCard();
      await page.waitForURL(/\/rckik\/\d+/);
      await rckikDetailsPage.waitForAllSections();

      // Act 1 - Zmień grupę krwi w wykresie (jeśli dostępne)
      const isSelectorVisible = await rckikDetailsPage.bloodGroupSelector.isVisible().catch(() => false);

      if (isSelectorVisible) {
        await rckikDetailsPage.selectBloodGroup('0+');

        // Assert 1 - Wykres powinien się zaktualizować
        await page.waitForTimeout(500);
        const isChartVisible = await rckikDetailsPage.isChartVisible();
        const isEmptyVisible = await rckikDetailsPage.isChartEmptyStateVisible();
        expect(isChartVisible || isEmptyVisible).toBe(true);
      }

      // Act 2 - Filtruj tabelę historii (jeśli dostępna)
      const isFilterVisible = await rckikDetailsPage.bloodGroupFilter.isVisible().catch(() => false);

      if (isFilterVisible) {
        await rckikDetailsPage.filterHistoryByBloodGroup('A+');

        // Assert 2 - Tabela powinna się zaktualizować
        await page.waitForTimeout(500);
        const isTableVisible = await rckikDetailsPage.isHistoryTableVisible();
        const isEmptyVisible = await rckikDetailsPage.isHistoryTableEmptyStateVisible();
        expect(isTableVisible || isEmptyVisible).toBe(true);
      }
    });
  });

  test.describe('Scenariusz 5: Shareable URLs - pełny flow', () => {
    test('TC-FLOW-08: Użytkownik powinien móc udostępnić URL z filtrami i wrócić do tego samego stanu', async ({ page, context }) => {
      // Arrange
      await rckikListPage.goto();
      await rckikListPage.waitForRckikCards();

      // Act 1 - Zastosuj filtry i wyszukiwanie
      await rckikListPage.searchByName('Warszawa');
      await rckikListPage.sortBy('name');

      // Assert 1 - URL zawiera wszystkie parametry
      const currentUrl = rckikListPage.getCurrentUrl();
      expect(currentUrl).toContain('search=Warszawa');
      expect(currentUrl).toContain('sortBy=name');

      // Act 2 - Skopiuj URL i otwórz w nowej karcie
      const sharedUrl = currentUrl;
      const newPage = await context.newPage();
      await newPage.goto(sharedUrl);

      // Assert 2 - Nowa karta powinna mieć te same filtry zastosowane
      const newRckikListPage = new RckikListPage(newPage);
      await newRckikListPage.waitForRckikCards();

      const searchInputValue = await newRckikListPage.searchInput.inputValue();
      expect(searchInputValue).toBe('Warszawa');

      const newUrl = newPage.url();
      expect(newUrl).toContain('search=Warszawa');
      expect(newUrl).toContain('sortBy=name');

      await newPage.close();
    });

    test('TC-FLOW-09: Użytkownik powinien móc udostępnić bezpośredni link do centrum', async ({ page, context }) => {
      // Arrange
      await rckikListPage.goto();
      await rckikListPage.waitForRckikCards();

      // Act 1 - Otwórz szczegóły centrum
      const centerName = await rckikListPage.getRckikCardName(0);
      await rckikListPage.clickFirstRckikCard();
      await page.waitForURL(/\/rckik\/\d+/);

      // Assert 1 - Zapisz URL szczegółów
      const detailsUrl = page.url();
      expect(detailsUrl).toMatch(/\/rckik\/\d+/);

      // Act 2 - Otwórz ten sam URL w nowej karcie
      const newPage = await context.newPage();
      await newPage.goto(detailsUrl);

      // Assert 2 - Nowa karta powinna pokazać te same szczegóły centrum
      const newRckikDetailsPage = new RckikDetailsPage(newPage);
      await newRckikDetailsPage.waitForAllSections();

      const newCenterName = await newRckikDetailsPage.getRckikName();
      expect(newCenterName).toContain(centerName.split(' ').slice(0, 3).join(' '));

      await newPage.close();
    });
  });

  test.describe('Scenariusz 6: Browser navigation (back/forward)', () => {
    test('TC-FLOW-10: Użytkownik powinien móc nawigować używając przycisków wstecz/dalej przeglądarki', async ({ page }) => {
      // Arrange - Początek na liście
      await rckikListPage.goto();
      await rckikListPage.waitForRckikCards();

      // Act 1 - Wyszukaj centrum
      await rckikListPage.searchByName('Warszawa');
      const searchUrl = page.url();

      // Act 2 - Otwórz szczegóły
      await rckikListPage.clickFirstRckikCard();
      await page.waitForURL(/\/rckik\/\d+/);
      const detailsUrl = page.url();

      // Act 3 - Wróć wstecz do wyników wyszukiwania
      await page.goBack();

      // Assert 1 - Powinniśmy być z powrotem na liście z wyszukiwaniem
      await page.waitForURL(/\/rckik\?.*search=Warszawa/);
      expect(page.url()).toBe(searchUrl);

      // Act 4 - Wróć wstecz do listy bez filtrów
      await page.goBack();

      // Assert 2 - Powinniśmy być na liście bez filtrów
      await page.waitForURL(/\/rckik$/);

      // Act 5 - Przejdź dalej do wyników wyszukiwania
      await page.goForward();

      // Assert 3 - Powinniśmy być znowu na wynikach wyszukiwania
      await page.waitForURL(/\/rckik\?.*search=Warszawa/);
      expect(page.url()).toBe(searchUrl);

      // Act 6 - Przejdź dalej do szczegółów
      await page.goForward();

      // Assert 4 - Powinniśmy być na szczegółach centrum
      await page.waitForURL(/\/rckik\/\d+/);
      expect(page.url()).toBe(detailsUrl);
    });
  });
});
