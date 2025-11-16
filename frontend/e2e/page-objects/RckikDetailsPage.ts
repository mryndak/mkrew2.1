import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for RCKiK Details Page (/rckik/[id])
 * Tests: Szczegóły centrum krwiodawstwa with blood levels, history, and charts
 *
 * Updated based on actual implementation:
 * - Breadcrumbs navigation
 * - RckikHeader component (h1, code, address, Badge, FavoriteButton)
 * - Current Blood Levels section (h2, grid with BloodLevelBadge x8, timestamp)
 * - BloodLevelChart component (BloodGroupSelector + LineChart from recharts)
 * - HistoryTable component (table, filters, pagination)
 * - ScraperStatus component (Badge with status)
 */
export class RckikDetailsPage extends BasePage {
  // Breadcrumbs
  readonly breadcrumbs: Locator;
  readonly breadcrumbListLink: Locator;

  // Header elements - RckikHeader component
  readonly pageHeading: Locator;
  readonly rckikCode: Locator;
  readonly rckikAddress: Locator;
  readonly rckikLocation: Locator; // Google Maps link
  readonly favoriteButton: Locator;
  readonly activeStatusBadge: Locator;

  // Current Blood Levels Section
  readonly currentBloodLevelsSectionHeading: Locator;
  readonly bloodLevelBadges: Locator;
  readonly bloodLevelGrid: Locator;
  readonly lastUpdateInfo: Locator;
  readonly noDataMessage: Locator;

  // Blood Level Chart Section - BloodLevelChart component
  readonly bloodLevelChartSection: Locator;
  readonly bloodGroupSelector: Locator;
  readonly bloodGroupButtons: Locator;
  readonly bloodLevelChart: Locator; // recharts LineChart
  readonly chartEmptyState: Locator;
  readonly chartErrorState: Locator;

  // History Table Section - HistoryTable component
  readonly historyTableSection: Locator;
  readonly historyTable: Locator;
  readonly historyTableRows: Locator;
  readonly historyTableEmptyState: Locator;
  readonly historyPagination: Locator;

  // History Table Filters
  readonly bloodGroupFilter: Locator;
  readonly dateFromFilter: Locator;
  readonly dateToFilter: Locator;
  readonly clearFiltersButton: Locator;

  // Scraper Status Section - ScraperStatus component
  readonly scraperStatusSection: Locator;
  readonly scraperStatusBadge: Locator;

  constructor(page: Page) {
    super(page);

    // Breadcrumbs - based on [id].astro
    this.breadcrumbs = page.locator('nav').first(); // First nav is breadcrumbs
    this.breadcrumbListLink = this.breadcrumbs.locator('a:has-text("Lista RCKiK")');

    // Header - based on RckikHeader.tsx
    this.pageHeading = page.locator('h1').first();
    this.rckikCode = page.locator('p:has-text("Kod:")');
    this.rckikAddress = page.locator('address').first();
    this.rckikLocation = page.locator('a[href*="google.com/maps"]');
    this.favoriteButton = page.locator('button[aria-label*="ulubiony"], button[aria-label*="dodaj do ulubionych"]');
    this.activeStatusBadge = page.locator('span:has-text("Aktywne"), span:has-text("Nieaktywne")').first();

    // Current Blood Levels Section - based on [id].astro
    this.currentBloodLevelsSectionHeading = page.locator('h2:has-text("Aktualne stany krwi")');
    this.bloodLevelGrid = page.locator('.grid').first(); // First grid is for blood levels
    this.bloodLevelBadges = this.bloodLevelGrid.locator('> div'); // Direct children of grid
    this.lastUpdateInfo = page.locator('p:has-text("Ostatnia aktualizacja")');
    this.noDataMessage = page.locator('p:has-text("Brak aktualnych danych")');

    // Blood Level Chart Section - based on BloodLevelChart.tsx
    this.bloodLevelChartSection = page.locator('section').nth(2); // Third section
    this.bloodGroupSelector = page.locator('[role="group"]').filter({ hasText: /[0AB][+-]/ });
    this.bloodGroupButtons = this.bloodGroupSelector.locator('button');
    this.bloodLevelChart = page.locator('.recharts-wrapper'); // Recharts wrapper
    this.chartEmptyState = page.locator('text="Brak danych"').and(page.locator('section').nth(2).locator('div'));
    this.chartErrorState = page.locator('text=/Wystąpił błąd|Error/i').and(page.locator('section').nth(2).locator('div'));

    // History Table Section - based on HistoryTable.tsx
    this.historyTableSection = page.locator('section').nth(3); // Fourth section
    this.historyTable = page.locator('table');
    this.historyTableRows = this.historyTable.locator('tbody tr');
    this.historyTableEmptyState = page.locator('text="Brak danych historycznych"');
    this.historyPagination = this.historyTableSection.locator('nav[aria-label*="Paginacja"]');

    // History Table Filters
    this.bloodGroupFilter = page.locator('select[aria-label*="grupa krwi"], select:has(option:has-text("A+"))');
    this.dateFromFilter = page.locator('input[type="date"]').first();
    this.dateToFilter = page.locator('input[type="date"]').nth(1);
    this.clearFiltersButton = page.locator('button:has-text("Wyczyść")').last();

    // Scraper Status Section - based on ScraperStatus.tsx
    this.scraperStatusSection = page.locator('section').nth(4); // Fifth section
    this.scraperStatusBadge = this.scraperStatusSection.locator('span').first(); // Badge with status
  }

  /**
   * Navigate to RCKiK details page
   */
  async goto(rckikId: number | string) {
    await super.goto(`/rckik/${rckikId}`);
    await this.waitForPageLoad();
  }

  /**
   * Wait for all main sections to load
   */
  async waitForAllSections() {
    await this.waitForElement(this.pageHeading);
    await this.waitForElement(this.bloodLevelBadges.first());
  }

  /**
   * Get RCKiK name from heading
   */
  async getRckikName(): Promise<string> {
    return (await this.pageHeading.textContent()) || '';
  }

  /**
   * Get RCKiK code
   */
  async getRckikCode(): Promise<string> {
    const text = (await this.rckikCode.textContent()) || '';
    return text.replace('Kod: ', '').trim();
  }

  /**
   * Get RCKiK address
   */
  async getRckikAddress(): Promise<string> {
    return (await this.rckikAddress.textContent()) || '';
  }

  /**
   * Get number of blood level badges displayed
   */
  async getBloodLevelBadgesCount(): Promise<number> {
    return await this.bloodLevelBadges.count();
  }

  /**
   * Verify if all 8 blood groups are displayed
   */
  async verifyAllBloodGroupsDisplayed(): Promise<boolean> {
    const count = await this.getBloodLevelBadgesCount();
    return count === 8;
  }

  /**
   * Click favorite button to add/remove from favorites
   */
  async toggleFavorite() {
    await this.clickButton(this.favoriteButton);
    // Wait for potential navigation to login page or API response
    await this.page.waitForTimeout(1000);
  }

  /**
   * Check if RCKiK is marked as favorite
   */
  async isFavorite(): Promise<boolean> {
    const ariaLabel = await this.favoriteButton.getAttribute('aria-label');
    return ariaLabel?.toLowerCase().includes('usuń') || false;
  }

  /**
   * Select blood group in chart selector
   */
  async selectBloodGroup(bloodGroup: string) {
    const button = this.bloodGroupButtons.filter({ hasText: bloodGroup });
    await this.clickButton(button);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if chart is visible
   */
  async isChartVisible(): Promise<boolean> {
    return await this.bloodLevelChart.isVisible();
  }

  /**
   * Check if chart empty state is visible
   */
  async isChartEmptyStateVisible(): Promise<boolean> {
    return await this.chartEmptyState.isVisible();
  }

  /**
   * Filter history table by blood group
   */
  async filterHistoryByBloodGroup(bloodGroup: string) {
    await this.bloodGroupFilter.selectOption({ label: bloodGroup });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Filter history table by date range
   */
  async filterHistoryByDateRange(fromDate: string, toDate: string) {
    await this.dateFromFilter.fill(fromDate);
    await this.dateToFilter.fill(toDate);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Clear history table filters
   */
  async clearHistoryFilters() {
    await this.clickButton(this.clearFiltersButton);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get history table rows count
   */
  async getHistoryTableRowsCount(): Promise<number> {
    return await this.historyTableRows.count();
  }

  /**
   * Check if history table is visible
   */
  async isHistoryTableVisible(): Promise<boolean> {
    return await this.historyTable.isVisible();
  }

  /**
   * Check if history table empty state is visible
   */
  async isHistoryTableEmptyStateVisible(): Promise<boolean> {
    return await this.historyTableEmptyState.isVisible();
  }

  /**
   * Get scraper status text
   */
  async getScraperStatus(): Promise<string> {
    return (await this.scraperStatusBadge.textContent()) || '';
  }

  /**
   * Navigate to RCKiK list via breadcrumbs
   */
  async navigateToListViaBreadcrumbs() {
    await this.clickButton(this.breadcrumbListLink);
  }

  /**
   * Verify all main sections are rendered
   */
  async verifyAllSectionsRendered(): Promise<void> {
    // Header
    await this.waitForElement(this.pageHeading);
    await this.waitForElement(this.rckikAddress);

    // Blood levels section
    await this.waitForElement(this.currentBloodLevelsSectionHeading);
    await this.waitForElement(this.bloodLevelBadges.first());

    // Chart section (check if exists)
    const chartVisible = await this.bloodLevelChartSection.isVisible().catch(() => false);
    if (chartVisible) {
      await this.waitForElement(this.bloodGroupSelector);
    }

    // History table section (check if exists)
    const historyVisible = await this.historyTableSection.isVisible().catch(() => false);
    if (historyVisible) {
      await this.waitForElement(this.historyTable);
    }

    // Scraper status section (check if exists)
    const scraperVisible = await this.scraperStatusSection.isVisible().catch(() => false);
    if (scraperVisible) {
      await this.waitForElement(this.scraperStatusBadge);
    }
  }

  /**
   * Check if active status badge is displayed
   */
  async isActiveStatusBadgeVisible(): Promise<boolean> {
    return await this.activeStatusBadge.isVisible();
  }

  /**
   * Get active status badge text
   */
  async getActiveStatusBadgeText(): Promise<string> {
    return (await this.activeStatusBadge.textContent()) || '';
  }

  /**
   * Click on map location link
   */
  async clickMapLocation() {
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.rckikLocation.click()
    ]);
    return newPage;
  }

  /**
   * Check if breadcrumbs are visible
   */
  async isBreadcrumbsVisible(): Promise<boolean> {
    return await this.breadcrumbs.isVisible();
  }
}
