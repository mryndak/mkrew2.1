import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Page Object for Admin RCKiK Management Page
 *
 * Odpowiada za zarządzanie kanoniczną listą RCKiK (US-019).
 *
 * Funkcjonalności:
 * - Przeglądanie listy centrów RCKiK
 * - Filtrowanie po nazwie, mieście, statusie
 * - Sortowanie kolumn
 * - Dodawanie nowego centrum
 * - Edycja istniejącego centrum
 * - Dezaktywacja centrum
 * - Paginacja
 *
 * @example
 * ```ts
 * const rckikPage = new AdminRckikManagementPage(page);
 * await rckikPage.goto();
 * await rckikPage.clickAddButton();
 * await rckikPage.fillRckikForm({
 *   name: 'RCKiK Warszawa',
 *   code: 'RCKIK-WAW',
 *   city: 'Warszawa'
 * });
 * await rckikPage.submitForm();
 * ```
 */
export class AdminRckikManagementPage extends BasePage {
  // Main page locators
  readonly pageTitle: Locator;
  readonly addButton: Locator;
  readonly errorState: Locator;
  readonly errorMessage: Locator;
  readonly retryButton: Locator;

  // Filters locators
  readonly searchInput: Locator;
  readonly citySelect: Locator;
  readonly statusSelect: Locator;
  readonly clearFiltersButton: Locator;

  // Table locators
  readonly table: Locator;
  readonly tableRows: Locator;
  readonly emptyState: Locator;

  // Form modal locators (shared for create and edit)
  readonly formModal: Locator;
  readonly formNameInput: Locator;
  readonly formCodeInput: Locator;
  readonly formCityInput: Locator;
  readonly formAddressTextarea: Locator;
  readonly formLatitudeInput: Locator;
  readonly formLongitudeInput: Locator;
  readonly formAliasesInput: Locator;
  readonly formActiveCheckbox: Locator;
  readonly formSubmitButton: Locator;
  readonly formCancelButton: Locator;

  // Delete confirmation modal locators
  readonly deleteModal: Locator;
  readonly deleteConfirmButton: Locator;
  readonly deleteCancelButton: Locator;

  // Pagination locators
  readonly paginationInfo: Locator;
  readonly nextPageButton: Locator;
  readonly prevPageButton: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize main page locators
    this.pageTitle = this.getByTestId('admin-rckik-page-title');
    this.addButton = this.getByTestId('admin-rckik-add-button');
    this.errorState = this.getByTestId('admin-rckik-error-state');
    this.errorMessage = this.getByTestId('admin-rckik-error-message');
    this.retryButton = this.getByTestId('admin-rckik-retry-button');

    // Initialize filters
    this.searchInput = page.locator('input[type="search"]');
    this.citySelect = page.locator('select').first();
    this.statusSelect = page.locator('select').nth(1);
    this.clearFiltersButton = page.getByRole('button', { name: /Wyczyść filtry/i });

    // Initialize table
    this.table = page.locator('table');
    this.tableRows = this.getByTestId('admin-rckik-table-row');
    this.emptyState = page.getByText(/Brak centrów/i);

    // Initialize form modal fields (by labels and IDs)
    this.formModal = page.locator('[role="dialog"]');
    this.formNameInput = page.locator('input[name="name"]');
    this.formCodeInput = page.locator('input[name="code"]');
    this.formCityInput = page.locator('input[name="city"]');
    this.formAddressTextarea = page.locator('textarea#address');
    this.formLatitudeInput = page.locator('input[name="latitude"]');
    this.formLongitudeInput = page.locator('input[name="longitude"]');
    this.formAliasesInput = page.locator('input[name="aliases"]');
    this.formActiveCheckbox = page.locator('input#active[type="checkbox"]');
    this.formSubmitButton = page.locator('button[type="submit"]');
    this.formCancelButton = page.getByRole('button', { name: /Anuluj/i });

    // Initialize delete modal
    this.deleteModal = page.locator('[role="dialog"]');
    this.deleteConfirmButton = page.getByRole('button', { name: /Potwierdź dezaktywację/i });
    this.deleteCancelButton = page.getByRole('button', { name: /Anuluj/i });

    // Initialize pagination
    this.paginationInfo = page.locator('text=/Wyświetlanie/');
    this.nextPageButton = page.getByRole('button', { name: /Następna/i });
    this.prevPageButton = page.getByRole('button', { name: /Poprzednia/i });
  }

  /**
   * Navigate to admin RCKiK management page
   */
  async goto() {
    await super.goto('/admin/rckik');
    await this.waitForPageLoad();
  }

  /**
   * Click "Add new center" button
   */
  async clickAddButton() {
    await this.clickButton(this.addButton);
    await this.formModal.waitFor({ state: 'visible' });
  }

  /**
   * Fill RCKiK form (for create or edit)
   * @param data - RCKiK data to fill
   */
  async fillRckikForm(data: {
    name?: string;
    code?: string;
    city?: string;
    address?: string;
    latitude?: string;
    longitude?: string;
    aliases?: string;
    active?: boolean;
  }) {
    if (data.name !== undefined) {
      await this.fillInput(this.formNameInput, data.name);
    }
    if (data.code !== undefined) {
      await this.fillInput(this.formCodeInput, data.code);
    }
    if (data.city !== undefined) {
      await this.fillInput(this.formCityInput, data.city);
    }
    if (data.address !== undefined) {
      await this.fillInput(this.formAddressTextarea, data.address);
    }
    if (data.latitude !== undefined) {
      await this.fillInput(this.formLatitudeInput, data.latitude);
    }
    if (data.longitude !== undefined) {
      await this.fillInput(this.formLongitudeInput, data.longitude);
    }
    if (data.aliases !== undefined) {
      await this.fillInput(this.formAliasesInput, data.aliases);
    }
    if (data.active !== undefined) {
      const isChecked = await this.formActiveCheckbox.isChecked();
      if (isChecked !== data.active) {
        await this.formActiveCheckbox.click();
      }
    }
  }

  /**
   * Submit RCKiK form
   */
  async submitForm() {
    await this.clickButton(this.formSubmitButton);
    // Wait for modal to close
    await this.formModal.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Cancel form
   */
  async cancelForm() {
    await this.clickButton(this.formCancelButton);
    await this.formModal.waitFor({ state: 'hidden' });
  }

  /**
   * Search for RCKiK by name or code
   * @param query - Search query
   */
  async searchRckik(query: string) {
    await this.fillInput(this.searchInput, query);
    // Wait for debounce and results
    await this.page.waitForTimeout(500);
  }

  /**
   * Filter by city
   * @param city - City name (empty string for "All cities")
   */
  async filterByCity(city: string) {
    await this.citySelect.selectOption(city);
  }

  /**
   * Filter by status
   * @param status - Status ('true' for active, 'false' for inactive, '' for all)
   */
  async filterByStatus(status: 'true' | 'false' | '') {
    await this.statusSelect.selectOption(status);
  }

  /**
   * Clear all filters
   */
  async clearFilters() {
    await this.clickButton(this.clearFiltersButton);
  }

  /**
   * Get row by RCKiK name
   * @param name - RCKiK name
   * @returns Row locator
   */
  getRowByName(name: string): Locator {
    return this.page.locator(`tr:has-text("${name}")`);
  }

  /**
   * Click edit button for specific RCKiK
   * @param name - RCKiK name
   */
  async clickEditButton(name: string) {
    const row = this.getRowByName(name);
    const editButton = row.getByTestId('admin-rckik-edit-button');
    await this.clickButton(editButton);
    await this.formModal.waitFor({ state: 'visible' });
  }

  /**
   * Click delete button for specific RCKiK
   * @param name - RCKiK name
   */
  async clickDeleteButton(name: string) {
    const row = this.getRowByName(name);
    const deleteButton = row.getByTestId('admin-rckik-delete-button');
    await this.clickButton(deleteButton);
    await this.deleteModal.waitFor({ state: 'visible' });
  }

  /**
   * Confirm deletion in modal
   */
  async confirmDelete() {
    await this.clickButton(this.deleteConfirmButton);
    await this.deleteModal.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Cancel deletion
   */
  async cancelDelete() {
    await this.clickButton(this.deleteCancelButton);
    await this.deleteModal.waitFor({ state: 'hidden' });
  }

  /**
   * Get count of RCKiK rows in table
   * @returns Number of rows
   */
  async getRowCount(): Promise<number> {
    return await this.tableRows.count();
  }

  /**
   * Check if RCKiK exists in table
   * @param name - RCKiK name
   * @returns True if exists
   */
  async rckikExists(name: string): Promise<boolean> {
    const row = this.getRowByName(name);
    return await row.count() > 0;
  }

  /**
   * Get RCKiK status from table
   * @param name - RCKiK name
   * @returns 'active' or 'inactive'
   */
  async getRckikStatus(name: string): Promise<'active' | 'inactive'> {
    const row = this.getRowByName(name);
    const activeStatus = row.getByTestId('admin-rckik-row-status-active');
    const isActive = await activeStatus.isVisible();
    return isActive ? 'active' : 'inactive';
  }

  /**
   * Wait for table to load
   */
  async waitForTableLoad() {
    // Wait for either table rows or empty state
    await Promise.race([
      this.tableRows.first().waitFor({ state: 'visible' }),
      this.emptyState.waitFor({ state: 'visible' }),
    ]);
  }

  /**
   * Check if error state is visible
   * @returns True if error is displayed
   */
  async hasError(): Promise<boolean> {
    return await this.errorState.isVisible();
  }

  /**
   * Get error message text
   * @returns Error message
   */
  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  /**
   * Click retry button when error occurs
   */
  async clickRetry() {
    await this.clickButton(this.retryButton);
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
   * Get form validation error for specific field
   * @param fieldName - Field name (e.g., 'name', 'code', 'city')
   * @returns Error message or null
   */
  async getFormFieldError(fieldName: string): Promise<string | null> {
    const errorLocator = this.page.locator(`[role="alert"]:near(input[name="${fieldName}"])`).first();
    const isVisible = await errorLocator.isVisible();
    if (isVisible) {
      return await errorLocator.textContent();
    }
    return null;
  }
}
