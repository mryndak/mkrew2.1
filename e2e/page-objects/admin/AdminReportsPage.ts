import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Page Object for Admin Reports Management Page
 *
 * Odpowiada za zarządzanie zgłoszeniami użytkowników o problemach z danymi (US-021).
 *
 * Funkcjonalności:
 * - Przeglądanie listy zgłoszeń
 * - Filtrowanie po statusie, dacie, RCKiK
 * - Podgląd szczegółów zgłoszenia
 * - Zmiana statusu zgłoszenia (PENDING → IN_PROGRESS → RESOLVED/REJECTED)
 * - Dodawanie notatek administratora
 * - Paginacja
 *
 * @example
 * ```ts
 * const reportsPage = new AdminReportsPage(page);
 * await reportsPage.goto();
 * await reportsPage.filterByStatus('PENDING');
 * await reportsPage.clickViewDetails(123);
 * await reportsPage.setAdminNotes('Sprawdzone, problem poprawiony');
 * await reportsPage.resolveReport();
 * ```
 */
export class AdminReportsPage extends BasePage {
  // Main page locators
  readonly pageTitle: Locator;
  readonly reportsCount: Locator;

  // Filters locators
  readonly statusFilter: Locator;
  readonly rckikFilter: Locator;
  readonly fromDateInput: Locator;
  readonly toDateInput: Locator;
  readonly clearFiltersButton: Locator;

  // Table locators
  readonly reportsTable: Locator;
  readonly reportRows: Locator;
  readonly emptyState: Locator;

  // Report details modal locators
  readonly detailsModal: Locator;
  readonly modalTitle: Locator;
  readonly modalCloseButton: Locator;
  readonly adminNotesTextarea: Locator;
  readonly statusSelect: Locator;
  readonly resolveButton: Locator;
  readonly rejectButton: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  // Pagination locators
  readonly paginationInfo: Locator;
  readonly nextPageButton: Locator;
  readonly prevPageButton: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize main page locators
    this.pageTitle = page.getByRole('heading', { name: /Zgłoszenia/i });
    this.reportsCount = page.locator('text=/Łącznie:/');

    // Initialize filters
    this.statusFilter = page.locator('select[name="status"]');
    this.rckikFilter = page.locator('select[name="rckik"]');
    this.fromDateInput = page.locator('input[type="date"]').first();
    this.toDateInput = page.locator('input[type="date"]').nth(1);
    this.clearFiltersButton = page.getByRole('button', { name: /Wyczyść filtry/i });

    // Initialize table
    this.reportsTable = page.locator('table');
    this.reportRows = this.getByTestId('admin-reports-table-row');
    this.emptyState = page.getByText(/Brak zgłoszeń/i);

    // Initialize details modal
    this.detailsModal = this.getByTestId('admin-reports-details-modal');
    this.modalTitle = this.getByTestId('admin-reports-modal-title');
    this.modalCloseButton = this.getByTestId('admin-reports-modal-close-button');
    this.adminNotesTextarea = this.getByTestId('admin-reports-admin-notes-textarea');
    this.statusSelect = this.getByTestId('admin-reports-status-select');
    this.resolveButton = this.getByTestId('admin-reports-resolve-button');
    this.rejectButton = this.getByTestId('admin-reports-reject-button');
    this.saveButton = this.getByTestId('admin-reports-save-button');
    this.cancelButton = this.getByTestId('admin-reports-cancel-button');

    // Initialize pagination
    this.paginationInfo = page.locator('text=/Wyświetlanie/');
    this.nextPageButton = page.getByRole('button', { name: /Następna/i });
    this.prevPageButton = page.getByRole('button', { name: /Poprzednia/i });
  }

  /**
   * Navigate to admin reports page
   */
  async goto() {
    await super.goto('/admin/reports');
    await this.waitForPageLoad();
  }

  /**
   * Filter reports by status
   * @param status - Report status (PENDING, IN_PROGRESS, RESOLVED, REJECTED)
   */
  async filterByStatus(status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED' | '') {
    await this.statusFilter.selectOption(status);
  }

  /**
   * Filter reports by RCKiK
   * @param rckikId - RCKiK ID (empty string for all)
   */
  async filterByRckik(rckikId: string) {
    await this.rckikFilter.selectOption(rckikId);
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
   * Get report row by ID
   * @param reportId - Report ID
   * @returns Row locator
   */
  getReportRowById(reportId: number): Locator {
    return this.page.locator(`tr:has([data-test-id="admin-reports-row-id"]:has-text("#${reportId}"))`);
  }

  /**
   * Click view details for specific report
   * @param reportId - Report ID
   */
  async clickViewDetails(reportId: number) {
    const row = this.getReportRowById(reportId);
    const detailsButton = row.getByTestId('admin-reports-view-details-button');
    await this.clickButton(detailsButton);
    await this.detailsModal.waitFor({ state: 'visible' });
  }

  /**
   * Alternative: Click on row to open details
   * @param reportId - Report ID
   */
  async clickReportRow(reportId: number) {
    const row = this.getReportRowById(reportId);
    await this.clickButton(row);
    await this.detailsModal.waitFor({ state: 'visible' });
  }

  /**
   * Set admin notes in details modal
   * @param notes - Admin notes text
   */
  async setAdminNotes(notes: string) {
    await this.fillInput(this.adminNotesTextarea, notes);
  }

  /**
   * Change report status in modal
   * @param status - New status
   */
  async changeStatus(status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED') {
    await this.statusSelect.selectOption(status);
  }

  /**
   * Click resolve button (quick action)
   */
  async clickResolve() {
    await this.clickButton(this.resolveButton);
  }

  /**
   * Click reject button (quick action)
   */
  async clickReject() {
    await this.clickButton(this.rejectButton);
  }

  /**
   * Save changes in details modal
   */
  async saveChanges() {
    await this.clickButton(this.saveButton);
    await this.detailsModal.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Cancel and close details modal
   */
  async cancelModal() {
    await this.clickButton(this.cancelButton);
    await this.detailsModal.waitFor({ state: 'hidden' });
  }

  /**
   * Close details modal using X button
   */
  async closeModal() {
    await this.clickButton(this.modalCloseButton);
    await this.detailsModal.waitFor({ state: 'hidden' });
  }

  /**
   * Resolve report with notes (full flow)
   * @param reportId - Report ID
   * @param notes - Admin notes
   */
  async resolveReport(reportId: number, notes?: string) {
    await this.clickViewDetails(reportId);
    if (notes) {
      await this.setAdminNotes(notes);
    }
    await this.clickResolve();
    await this.detailsModal.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Reject report with notes (full flow)
   * @param reportId - Report ID
   * @param notes - Admin notes
   */
  async rejectReport(reportId: number, notes?: string) {
    await this.clickViewDetails(reportId);
    if (notes) {
      await this.setAdminNotes(notes);
    }
    await this.clickReject();
    await this.detailsModal.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Update report status with custom notes (full flow)
   * @param reportId - Report ID
   * @param status - New status
   * @param notes - Admin notes
   */
  async updateReport(
    reportId: number,
    status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED',
    notes?: string
  ) {
    await this.clickViewDetails(reportId);
    await this.changeStatus(status);
    if (notes) {
      await this.setAdminNotes(notes);
    }
    await this.saveChanges();
  }

  /**
   * Get count of report rows in table
   * @returns Number of rows
   */
  async getReportRowCount(): Promise<number> {
    return await this.reportRows.count();
  }

  /**
   * Check if report exists in table
   * @param reportId - Report ID
   * @returns True if exists
   */
  async reportExists(reportId: number): Promise<boolean> {
    const row = this.getReportRowById(reportId);
    return await row.count() > 0;
  }

  /**
   * Get report status from table
   * @param reportId - Report ID
   * @returns Status text
   */
  async getReportStatus(reportId: number): Promise<string> {
    const row = this.getReportRowById(reportId);
    const statusBadge = row.locator('[class*="status-badge"]');
    return await statusBadge.textContent() || '';
  }

  /**
   * Get report user name from table
   * @param reportId - Report ID
   * @returns User name
   */
  async getReportUserName(reportId: number): Promise<string> {
    const row = this.getReportRowById(reportId);
    const userName = row.getByTestId('admin-reports-row-user-name');
    return await userName.textContent() || '';
  }

  /**
   * Get report RCKiK name from table
   * @param reportId - Report ID
   * @returns RCKiK name
   */
  async getReportRckikName(reportId: number): Promise<string> {
    const row = this.getReportRowById(reportId);
    const rckikName = row.getByTestId('admin-reports-row-rckik-name');
    return await rckikName.textContent() || '';
  }

  /**
   * Wait for table to load
   */
  async waitForTableLoad() {
    // Wait for either table rows or empty state
    await Promise.race([
      this.reportRows.first().waitFor({ state: 'visible' }),
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
   * Get modal report ID from title
   * @returns Report ID from modal title
   */
  async getModalReportId(): Promise<number | null> {
    const titleText = await this.modalTitle.textContent();
    const match = titleText?.match(/#(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Get modal field value
   * @param fieldLabel - Field label (e.g., 'Użytkownik', 'RCKiK', 'Opis problemu')
   * @returns Field value
   */
  async getModalFieldValue(fieldLabel: string): Promise<string> {
    const field = this.detailsModal.locator(`dt:has-text("${fieldLabel}")`).locator('+ dd');
    return await field.textContent() || '';
  }
}
