import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for Donation Form Modal (Create/Edit)
 *
 * Covers:
 * - US-012: Add donation entry
 * - US-013: Edit donation entry
 * - TC-DON-02: Form validation (future date, invalid quantity)
 *
 * Features:
 * - RCKiK autocomplete search
 * - Date validation (past dates only)
 * - Quantity validation (50-1000 ml)
 * - Donation type selection
 * - Optional notes
 * - 56-day warning for full blood donations
 */
export class DonationFormModal extends BasePage {
  // Modal container
  readonly modal: Locator;
  readonly modalTitle: Locator;

  // Form fields
  readonly rckikInput: Locator;
  readonly dateInput: Locator;
  readonly quantityInput: Locator;
  readonly typeSelect: Locator;
  readonly notesTextarea: Locator;

  // Buttons
  readonly cancelButton: Locator;
  readonly submitButton: Locator;

  // Validation messages
  readonly warningBanner: Locator;
  readonly errorMessages: Locator;

  constructor(page: Page) {
    super(page);

    // Modal
    this.modal = this.getByTestId('donation-form-modal');
    this.modalTitle = this.modal.locator('h2, h3').first();

    // Form fields
    this.rckikInput = this.getByTestId('donation-form-rckik-autocomplete');
    this.dateInput = this.getByTestId('donation-form-date-input');
    this.quantityInput = this.getByTestId('donation-form-quantity-input');
    this.typeSelect = this.getByTestId('donation-form-type-select');
    this.notesTextarea = this.getByTestId('donation-form-notes-textarea');

    // Buttons
    this.cancelButton = this.getByTestId('donation-form-cancel-button');
    this.submitButton = this.getByTestId('donation-form-submit-button');

    // Validation
    this.warningBanner = this.getByTestId('donation-form-56-day-warning');
    this.errorMessages = page.locator('[role="alert"]');
  }

  /**
   * Wait for modal to open
   */
  async waitForModalOpen() {
    await this.waitForElement(this.modal);
    await this.waitForElement(this.modalTitle);
  }

  /**
   * Wait for modal to close
   */
  async waitForModalClose() {
    await this.modal.waitFor({ state: 'hidden' });
  }

  /**
   * Get modal mode (create or edit)
   */
  async getMode(): Promise<'create' | 'edit'> {
    const title = await this.modalTitle.textContent();
    return title?.includes('Dodaj') ? 'create' : 'edit';
  }

  /**
   * Select RCKiK from autocomplete
   *
   * Note: In edit mode, this field is readonly
   */
  async selectRckik(rckikName: string) {
    await this.rckikInput.click();
    await this.rckikInput.fill(rckikName);

    // Wait for autocomplete results
    await this.page.waitForTimeout(500);

    // Select first matching option
    const option = this.page.locator(`[role="option"]`).filter({ hasText: rckikName }).first();
    await option.click();
  }

  /**
   * Fill donation date
   *
   * Note: In edit mode, this field is readonly
   *
   * @param date - Date in YYYY-MM-DD format
   */
  async fillDate(date: string) {
    await this.fillInput(this.dateInput, date);
  }

  /**
   * Fill quantity in ml
   *
   * @param quantity - Quantity in ml (50-1000)
   */
  async fillQuantity(quantity: number) {
    await this.fillInput(this.quantityInput, quantity.toString());
  }

  /**
   * Select donation type
   */
  async selectDonationType(type: 'FULL_BLOOD' | 'PLASMA' | 'PLATELETS' | 'OTHER') {
    await this.typeSelect.selectOption(type);
  }

  /**
   * Fill optional notes
   */
  async fillNotes(notes: string) {
    await this.fillInput(this.notesTextarea, notes);
  }

  /**
   * Fill complete form
   *
   * Fields can be partial - only provided fields will be filled
   */
  async fillForm(data: {
    rckikName?: string;
    date?: string;
    quantity?: number;
    type?: 'FULL_BLOOD' | 'PLASMA' | 'PLATELETS' | 'OTHER';
    notes?: string;
  }) {
    if (data.rckikName) {
      await this.selectRckik(data.rckikName);
    }

    if (data.date) {
      await this.fillDate(data.date);
    }

    if (data.quantity !== undefined) {
      await this.fillQuantity(data.quantity);
    }

    if (data.type) {
      await this.selectDonationType(data.type);
    }

    if (data.notes !== undefined) {
      await this.fillNotes(data.notes);
    }
  }

  /**
   * Submit form
   */
  async submitForm() {
    await this.clickButton(this.submitButton);

    // Wait for modal to close (form submission successful)
    // or wait for error messages (validation failed)
    await Promise.race([
      this.waitForModalClose(),
      this.errorMessages.first().waitFor({ state: 'visible', timeout: 2000 }).catch(() => {})
    ]);
  }

  /**
   * Cancel form
   */
  async cancelForm() {
    await this.clickButton(this.cancelButton);
    await this.waitForModalClose();
  }

  /**
   * Check if 56-day warning is visible
   *
   * Warning appears when selecting FULL_BLOOD donation within 56 days of last donation
   */
  async is56DayWarningVisible(): Promise<boolean> {
    return await this.warningBanner.isVisible();
  }

  /**
   * Check if form has validation errors
   */
  async hasValidationErrors(): Promise<boolean> {
    return await this.errorMessages.count() > 0;
  }

  /**
   * Get validation error messages
   */
  async getValidationErrors(): Promise<string[]> {
    const count = await this.errorMessages.count();
    const errors: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await this.errorMessages.nth(i).textContent();
      if (text) errors.push(text);
    }

    return errors;
  }

  /**
   * Test validation: Try to submit form with future date
   *
   * Expected: Validation error should appear
   */
  async testFutureDateValidation(): Promise<boolean> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    await this.fillDate(futureDateStr);
    await this.submitForm();

    return await this.hasValidationErrors();
  }

  /**
   * Test validation: Try to submit form with invalid quantity
   *
   * Expected: Validation error should appear
   */
  async testInvalidQuantityValidation(quantity: number): Promise<boolean> {
    await this.fillQuantity(quantity);
    await this.submitForm();

    return await this.hasValidationErrors();
  }

  /**
   * Test validation: Try to submit empty form
   *
   * Expected: Validation errors for required fields
   */
  async testEmptyFormValidation(): Promise<boolean> {
    await this.submitForm();
    return await this.hasValidationErrors();
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitButtonDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Check if form is in loading state (submitting)
   */
  async isFormSubmitting(): Promise<boolean> {
    // Check if submit button has loading attribute or is disabled
    const isDisabled = await this.submitButton.isDisabled();
    const hasLoadingClass = await this.submitButton.evaluate(
      (el) => el.classList.contains('loading') || el.getAttribute('aria-busy') === 'true'
    );

    return isDisabled || hasLoadingClass;
  }
}
