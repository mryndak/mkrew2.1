import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { DonationFormModal } from './DonationFormModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

/**
 * Page Object for Donations Management Page (US-012, US-013, US-014)
 *
 * Covers:
 * - TC-DON-01: CRUD operations (Create, Read, Update, Delete donations)
 * - TC-DON-02: Validation (future date, invalid quantity)
 * - TC-DON-03: Export (CSV/JSON)
 * - TC-DON-04: Statistics verification
 */
export class DonationsPage extends BasePage {
  // Modals
  readonly donationFormModal: DonationFormModal;
  readonly deleteConfirmationModal: DeleteConfirmationModal;

  // Header & Statistics
  readonly pageTitle: Locator;
  readonly statsTotalDonations: Locator;
  readonly statsTotalQuantity: Locator;
  readonly statsLastDonation: Locator;
  readonly statsNextEligible: Locator;

  // Toolbar - Actions
  readonly addDonationButton: Locator;
  readonly sortSelect: Locator;
  readonly exportButton: Locator;
  readonly exportMenu: Locator;
  readonly exportCsvButton: Locator;
  readonly exportJsonButton: Locator;

  // Toolbar - Filters
  readonly filterDateFrom: Locator;
  readonly filterDateTo: Locator;
  readonly filterDonationType: Locator;
  readonly filterRckik: Locator;
  readonly clearFiltersButton: Locator;

  // Table
  readonly donationTable: Locator;
  readonly donationRows: Locator;

  // Pagination
  readonly paginationPrevious: Locator;
  readonly paginationNext: Locator;
  readonly paginationInfo: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize modals
    this.donationFormModal = new DonationFormModal(page);
    this.deleteConfirmationModal = new DeleteConfirmationModal(page);

    // Header & Statistics
    this.pageTitle = page.locator('h1').filter({ hasText: 'Moje donacje' });
    this.statsTotalDonations = page.locator('text=Liczba donacji').locator('..');
    this.statsTotalQuantity = page.locator('text=Oddana krew').locator('..');
    this.statsLastDonation = page.locator('text=Ostatnia donacja').locator('..');
    this.statsNextEligible = page.locator('text=Następna możliwa').locator('..');

    // Toolbar - Actions
    this.addDonationButton = this.getByTestId('add-donation-button');
    this.sortSelect = this.getByTestId('sort-select');
    this.exportButton = this.getByTestId('export-button');
    this.exportMenu = this.getByTestId('export-menu');
    this.exportCsvButton = this.getByTestId('export-csv-button');
    this.exportJsonButton = this.getByTestId('export-json-button');

    // Toolbar - Filters
    this.filterDateFrom = this.getByTestId('filter-date-from');
    this.filterDateTo = this.getByTestId('filter-date-to');
    this.filterDonationType = this.getByTestId('filter-donation-type');
    this.filterRckik = this.getByTestId('filter-rckik');
    this.clearFiltersButton = this.getByTestId('clear-filters-button');

    // Table
    this.donationTable = page.locator('table');
    this.donationRows = page.locator('[data-testid^="donation-row-"]');

    // Pagination
    this.paginationPrevious = this.getByTestId('pagination-previous');
    this.paginationNext = this.getByTestId('pagination-next');
    this.paginationInfo = page.locator('text=/Strona \\d+ z \\d+/');
  }

  /**
   * Navigate to donations page
   */
  async goto() {
    await super.goto('/dashboard/donations');
    await this.waitForPageLoad();
    await this.waitForElement(this.pageTitle);
  }

  /**
   * Get donation row by ID
   */
  getDonationRow(donationId: number): Locator {
    return this.getByTestId(`donation-row-${donationId}`);
  }

  /**
   * Get edit button for specific donation
   */
  getEditButton(donationId: number): Locator {
    return this.getByTestId(`edit-donation-${donationId}`);
  }

  /**
   * Get delete button for specific donation
   */
  getDeleteButton(donationId: number): Locator {
    return this.getByTestId(`delete-donation-${donationId}`);
  }

  /**
   * Open add donation modal
   */
  async openAddDonationModal() {
    await this.clickButton(this.addDonationButton);
    await this.donationFormModal.waitForModalOpen();
  }

  /**
   * Open edit donation modal
   */
  async openEditDonationModal(donationId: number) {
    const editButton = this.getEditButton(donationId);
    await this.clickButton(editButton);
    await this.donationFormModal.waitForModalOpen();
  }

  /**
   * Open delete confirmation modal
   */
  async openDeleteDonationModal(donationId: number) {
    const deleteButton = this.getDeleteButton(donationId);
    await this.clickButton(deleteButton);
    await this.deleteConfirmationModal.waitForModalOpen();
  }

  /**
   * Add new donation (complete flow)
   *
   * @param donationData - Donation details
   * @returns Promise<void>
   */
  async addDonation(donationData: {
    rckikName: string;
    date: string;
    quantity: number;
    type: 'FULL_BLOOD' | 'PLASMA' | 'PLATELETS' | 'OTHER';
    notes?: string;
  }) {
    await this.openAddDonationModal();
    await this.donationFormModal.fillForm(donationData);
    await this.donationFormModal.submitForm();
  }

  /**
   * Edit existing donation (complete flow)
   */
  async editDonation(
    donationId: number,
    updates: {
      quantity?: number;
      type?: 'FULL_BLOOD' | 'PLASMA' | 'PLATELETS' | 'OTHER';
      notes?: string;
    }
  ) {
    await this.openEditDonationModal(donationId);
    await this.donationFormModal.fillForm(updates);
    await this.donationFormModal.submitForm();
  }

  /**
   * Delete donation (complete flow)
   */
  async deleteDonation(donationId: number) {
    await this.openDeleteDonationModal(donationId);
    await this.deleteConfirmationModal.confirmDelete();
  }

  /**
   * Apply date range filter
   */
  async applyDateFilter(fromDate: string, toDate: string) {
    await this.fillInput(this.filterDateFrom, fromDate);
    await this.fillInput(this.filterDateTo, toDate);
  }

  /**
   * Apply donation type filter
   */
  async applyDonationTypeFilter(type: 'FULL_BLOOD' | 'PLASMA' | 'PLATELETS' | 'OTHER' | '') {
    await this.filterDonationType.selectOption(type);
  }

  /**
   * Apply RCKiK filter
   */
  async applyRckikFilter(rckikId: string) {
    await this.filterRckik.selectOption(rckikId);
  }

  /**
   * Clear all filters
   */
  async clearFilters() {
    await this.clickButton(this.clearFiltersButton);
  }

  /**
   * Change sort order
   */
  async changeSortOrder(sortOption: 'donationDate-DESC' | 'donationDate-ASC' | 'quantityMl-DESC' | 'quantityMl-ASC') {
    await this.sortSelect.selectOption(sortOption);
  }

  /**
   * Export donations to CSV (US-014)
   */
  async exportToCsv() {
    await this.clickButton(this.exportButton);
    await this.waitForElement(this.exportMenu);
    await this.clickButton(this.exportCsvButton);
  }

  /**
   * Export donations to JSON (US-014)
   */
  async exportToJson() {
    await this.clickButton(this.exportButton);
    await this.waitForElement(this.exportMenu);
    await this.clickButton(this.exportJsonButton);
  }

  /**
   * Navigate to next page
   */
  async goToNextPage() {
    await this.clickButton(this.paginationNext);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to previous page
   */
  async goToPreviousPage() {
    await this.clickButton(this.paginationPrevious);
    await this.waitForPageLoad();
  }

  /**
   * Get total donations count from statistics
   */
  async getTotalDonationsCount(): Promise<number> {
    const text = await this.statsTotalDonations.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Get total quantity from statistics
   */
  async getTotalQuantity(): Promise<number> {
    const text = await this.statsTotalQuantity.textContent();
    const match = text?.match(/(\d+)\s*ml/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Get number of visible donation rows
   */
  async getDonationRowCount(): Promise<number> {
    return await this.donationRows.count();
  }

  /**
   * Check if donation exists in table
   */
  async isDonationVisible(donationId: number): Promise<boolean> {
    const row = this.getDonationRow(donationId);
    return await row.isVisible();
  }

  /**
   * Get donation data from table row
   */
  async getDonationData(donationId: number): Promise<{
    date: string;
    rckik: string;
    type: string;
    quantity: string;
    confirmed: boolean;
  }> {
    const row = this.getDonationRow(donationId);
    const cells = row.locator('td');

    return {
      date: (await cells.nth(0).textContent()) || '',
      rckik: (await cells.nth(1).textContent()) || '',
      type: (await cells.nth(2).textContent()) || '',
      quantity: (await cells.nth(3).textContent()) || '',
      confirmed: await cells.nth(4).locator('svg.text-green-500').isVisible(),
    };
  }

  /**
   * Wait for statistics to update
   */
  async waitForStatisticsUpdate() {
    await this.page.waitForTimeout(500); // Small delay for stats to refresh
  }
}
