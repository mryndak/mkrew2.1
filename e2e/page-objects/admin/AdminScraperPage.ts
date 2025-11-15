import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Page Object for Admin Scraper Management Page
 *
 * Odpowiada za zarządzanie procesem scrapowania i ręczne uruchamianie parsowania (US-017).
 *
 * Funkcjonalności:
 * - Przeglądanie historii uruchomień scrapera
 * - Filtrowanie po typie (zaplanowane/ręczne), statusie, zakresie dat
 * - Manualne uruchomienie parsowania (wszystkich lub wybranych centrów)
 * - Podgląd szczegółów uruchomienia
 * - Monitoring statusu (auto-refresh dla running jobs)
 *
 * @example
 * ```ts
 * const scraperPage = new AdminScraperPage(page);
 * await scraperPage.goto();
 * await scraperPage.clickManualTriggerButton();
 * await scraperPage.selectRckiks(['RCKiK Warszawa']);
 * await scraperPage.confirmManualTrigger();
 * ```
 */
export class AdminScraperPage extends BasePage {
  // Main page locators
  readonly pageTitle: Locator;
  readonly manualTriggerButton: Locator;
  readonly globalStatus: Locator;

  // Filters locators
  readonly runTypeAllRadio: Locator;
  readonly runTypeScheduledRadio: Locator;
  readonly runTypeManualRadio: Locator;
  readonly statusRunningCheckbox: Locator;
  readonly statusCompletedCheckbox: Locator;
  readonly statusFailedCheckbox: Locator;
  readonly statusPartialCheckbox: Locator;
  readonly fromDateInput: Locator;
  readonly toDateInput: Locator;
  readonly clearFiltersButton: Locator;

  // Table locators
  readonly runsTable: Locator;
  readonly runRows: Locator;
  readonly emptyState: Locator;

  // Manual trigger modal locators
  readonly triggerModal: Locator;
  readonly rckikMultiSelect: Locator;
  readonly customUrlInput: Locator;
  readonly confirmCheckbox: Locator;
  readonly triggerSubmitButton: Locator;
  readonly triggerCancelButton: Locator;

  // Run details modal locators
  readonly detailsModal: Locator;
  readonly detailsCloseButton: Locator;

  // Pagination locators
  readonly paginationInfo: Locator;
  readonly nextPageButton: Locator;
  readonly prevPageButton: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize main page locators
    this.pageTitle = page.getByRole('heading', { name: /Scraper/i });
    this.manualTriggerButton = this.getByTestId('admin-scraper-manual-trigger-button');
    this.globalStatus = page.locator('[class*="global-status"]');

    // Initialize filters
    this.runTypeAllRadio = page.locator('input[type="radio"][value="all"]');
    this.runTypeScheduledRadio = page.locator('input[type="radio"]').filter({ hasText: /Zaplanowane/i });
    this.runTypeManualRadio = page.locator('input[type="radio"]').filter({ hasText: /Ręczne/i });

    this.statusRunningCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /W trakcie/i });
    this.statusCompletedCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /Zakończony/i });
    this.statusFailedCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /Błąd/i });
    this.statusPartialCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /Częściowy/i });

    this.fromDateInput = page.locator('input[type="date"]').first();
    this.toDateInput = page.locator('input[type="date"]').nth(1);
    this.clearFiltersButton = page.getByRole('button', { name: /Wyczyść/i });

    // Initialize table
    this.runsTable = this.getByTestId('admin-scraper-runs-table');
    this.runRows = this.getByTestId('admin-scraper-run-row');
    this.emptyState = this.getByTestId('admin-scraper-runs-empty-state');

    // Initialize manual trigger modal
    this.triggerModal = page.locator('[role="dialog"]', { has: page.getByText(/Ręczne uruchomienie scrapera/i) });
    this.rckikMultiSelect = page.locator('[class*="multi-select"]');
    this.customUrlInput = page.locator('input[name="customUrl"]');
    this.confirmCheckbox = page.locator('input[name="confirmed"][type="checkbox"]');
    this.triggerSubmitButton = page.locator('button[type="submit"]', { has: page.getByText(/Uruchom/i) });
    this.triggerCancelButton = page.getByRole('button', { name: /Anuluj/i });

    // Initialize details modal
    this.detailsModal = page.locator('[role="dialog"]', { has: page.getByText(/Szczegóły uruchomienia/i) });
    this.detailsCloseButton = this.detailsModal.getByRole('button', { name: /Zamknij/i });

    // Initialize pagination
    this.paginationInfo = page.locator('text=/Łącznie:/');
    this.nextPageButton = page.getByRole('button', { name: /Następna/i });
    this.prevPageButton = page.getByRole('button', { name: /Poprzednia/i });
  }

  /**
   * Navigate to admin scraper page
   */
  async goto() {
    await super.goto('/admin/scraper');
    await this.waitForPageLoad();
  }

  /**
   * Click manual trigger button to open modal
   */
  async clickManualTriggerButton() {
    await this.clickButton(this.manualTriggerButton);
    await this.triggerModal.waitFor({ state: 'visible' });
  }

  /**
   * Select RCKiK centers in manual trigger modal
   * @param rckikNames - Array of RCKiK names to select
   */
  async selectRckiks(rckikNames: string[]) {
    // Click multi-select to open dropdown
    await this.rckikMultiSelect.click();

    // Select each RCKiK
    for (const name of rckikNames) {
      const option = this.page.locator(`[role="option"]:has-text("${name}")`);
      await option.click();
    }

    // Close dropdown
    await this.page.keyboard.press('Escape');
  }

  /**
   * Set custom URL for manual trigger
   * @param url - Custom URL to scrape
   */
  async setCustomUrl(url: string) {
    await this.fillInput(this.customUrlInput, url);
  }

  /**
   * Confirm manual trigger (check confirmation checkbox)
   */
  async checkConfirmation() {
    await this.confirmCheckbox.check();
  }

  /**
   * Submit manual trigger
   */
  async submitManualTrigger() {
    await this.clickButton(this.triggerSubmitButton);
    await this.triggerModal.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Cancel manual trigger
   */
  async cancelManualTrigger() {
    await this.clickButton(this.triggerCancelButton);
    await this.triggerModal.waitFor({ state: 'hidden' });
  }

  /**
   * Trigger scraper for all centers
   */
  async triggerAllCenters() {
    await this.clickManualTriggerButton();
    await this.checkConfirmation();
    await this.submitManualTrigger();
  }

  /**
   * Trigger scraper for specific centers
   * @param rckikNames - Array of RCKiK names
   */
  async triggerSpecificCenters(rckikNames: string[]) {
    await this.clickManualTriggerButton();
    await this.selectRckiks(rckikNames);
    await this.checkConfirmation();
    await this.submitManualTrigger();
  }

  /**
   * Filter by run type
   * @param type - 'all', 'scheduled', or 'manual'
   */
  async filterByRunType(type: 'all' | 'scheduled' | 'manual') {
    switch (type) {
      case 'all':
        await this.runTypeAllRadio.check();
        break;
      case 'scheduled':
        await this.runTypeScheduledRadio.check();
        break;
      case 'manual':
        await this.runTypeManualRadio.check();
        break;
    }
  }

  /**
   * Filter by status
   * @param statuses - Array of statuses to filter
   */
  async filterByStatus(statuses: Array<'running' | 'completed' | 'failed' | 'partial'>) {
    // Uncheck all first
    if (await this.statusRunningCheckbox.isChecked()) {
      await this.statusRunningCheckbox.uncheck();
    }
    if (await this.statusCompletedCheckbox.isChecked()) {
      await this.statusCompletedCheckbox.uncheck();
    }
    if (await this.statusFailedCheckbox.isChecked()) {
      await this.statusFailedCheckbox.uncheck();
    }
    if (await this.statusPartialCheckbox.isChecked()) {
      await this.statusPartialCheckbox.uncheck();
    }

    // Check selected statuses
    for (const status of statuses) {
      switch (status) {
        case 'running':
          await this.statusRunningCheckbox.check();
          break;
        case 'completed':
          await this.statusCompletedCheckbox.check();
          break;
        case 'failed':
          await this.statusFailedCheckbox.check();
          break;
        case 'partial':
          await this.statusPartialCheckbox.check();
          break;
      }
    }
  }

  /**
   * Filter by date range
   * @param fromDate - From date (YYYY-MM-DD format)
   * @param toDate - To date (YYYY-MM-DD format)
   */
  async filterByDateRange(fromDate?: string, toDate?: string) {
    if (fromDate) {
      await this.fillInput(this.fromDateInput, fromDate);
    }
    if (toDate) {
      await this.fillInput(this.toDateInput, toDate);
    }
    // Wait for debounce
    await this.page.waitForTimeout(600);
  }

  /**
   * Clear all filters
   */
  async clearFilters() {
    await this.clickButton(this.clearFiltersButton);
  }

  /**
   * Get run row by ID
   * @param runId - Run ID
   * @returns Row locator
   */
  getRunRowById(runId: number): Locator {
    return this.page.locator(`tr:has([data-test-id="admin-scraper-run-id"]:has-text("${runId}"))`);
  }

  /**
   * Click view details button for specific run
   * @param runId - Run ID
   */
  async clickViewDetails(runId: number) {
    const row = this.getRunRowById(runId);
    const detailsButton = row.getByTestId('admin-scraper-run-details-button');
    await this.clickButton(detailsButton);
    await this.detailsModal.waitFor({ state: 'visible' });
  }

  /**
   * Close details modal
   */
  async closeDetailsModal() {
    await this.clickButton(this.detailsCloseButton);
    await this.detailsModal.waitFor({ state: 'hidden' });
  }

  /**
   * Get count of run rows in table
   * @returns Number of rows
   */
  async getRunRowCount(): Promise<number> {
    return await this.runRows.count();
  }

  /**
   * Check if there are running jobs
   * @returns True if at least one job is running
   */
  async hasRunningJobs(): Promise<boolean> {
    const runningBadges = this.page.locator('[class*="status-badge"]:has-text("W trakcie")');
    return await runningBadges.count() > 0;
  }

  /**
   * Wait for table to load
   */
  async waitForTableLoad() {
    // Wait for either table rows or empty state
    await Promise.race([
      this.runRows.first().waitFor({ state: 'visible' }),
      this.emptyState.waitFor({ state: 'visible' }),
    ]);
  }

  /**
   * Navigate to next page
   */
  async goToNextPage() {
    await this.clickButton(this.nextPageButton);
    await this.waitForTableLoad();
  }

  /**
   * Navigate to previous page
   */
  async goToPreviousPage() {
    await this.clickButton(this.prevPageButton);
    await this.waitForTableLoad();
  }

  /**
   * Get run status from table
   * @param runId - Run ID
   * @returns Status text (e.g., 'W trakcie', 'Zakończony', 'Błąd', 'Częściowy')
   */
  async getRunStatus(runId: number): Promise<string> {
    const row = this.getRunRowById(runId);
    const statusBadge = row.locator('[class*="status-badge"]');
    return await statusBadge.textContent() || '';
  }

  /**
   * Wait for run to complete
   * @param runId - Run ID to watch
   * @param timeout - Max wait time in ms (default: 60000)
   */
  async waitForRunCompletion(runId: number, timeout: number = 60000) {
    const row = this.getRunRowById(runId);
    const completedBadge = row.locator('[class*="status-badge"]:has-text(/Zakończony|Błąd|Częściowy/)');
    await completedBadge.waitFor({ state: 'visible', timeout });
  }
}
