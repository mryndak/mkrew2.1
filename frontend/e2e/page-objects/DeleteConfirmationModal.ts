import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for Delete Confirmation Modal
 *
 * Covers:
 * - US-013: Remove donation entry
 * - TC-DON-01: Delete operation in CRUD flow
 *
 * Features:
 * - Display donation details to be deleted
 * - Warning icon and message
 * - Cancel/Confirm actions
 * - Loading state during deletion
 */
export class DeleteConfirmationModal extends BasePage {
  // Modal container
  readonly modal: Locator;
  readonly modalTitle: Locator;

  // Content
  readonly warningIcon: Locator;
  readonly warningMessage: Locator;
  readonly donationDetails: Locator;

  // Buttons
  readonly cancelButton: Locator;
  readonly confirmButton: Locator;

  constructor(page: Page) {
    super(page);

    // Modal
    this.modal = this.getByTestId('delete-confirmation-modal');
    this.modalTitle = this.modal.locator('h3').filter({ hasText: 'Potwierdź usunięcie' });

    // Content
    this.warningIcon = this.modal.locator('svg.text-red-600');
    this.warningMessage = this.modal.locator('text=/Tej akcji nie można cofnąć/');
    this.donationDetails = this.modal.locator('.bg-gray-50');

    // Buttons
    this.cancelButton = this.getByTestId('delete-confirmation-cancel-button');
    this.confirmButton = this.getByTestId('delete-confirmation-delete-button');
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
   * Confirm deletion
   */
  async confirmDelete() {
    await this.clickButton(this.confirmButton);
    await this.waitForModalClose();
  }

  /**
   * Cancel deletion
   */
  async cancelDelete() {
    await this.clickButton(this.cancelButton);
    await this.waitForModalClose();
  }

  /**
   * Check if warning icon is visible
   */
  async isWarningIconVisible(): Promise<boolean> {
    return await this.warningIcon.isVisible();
  }

  /**
   * Check if warning message is visible
   */
  async isWarningMessageVisible(): Promise<boolean> {
    return await this.warningMessage.isVisible();
  }

  /**
   * Get donation details from modal
   */
  async getDonationDetails(): Promise<{
    date?: string;
    rckik?: string;
    type?: string;
    quantity?: string;
    notes?: string;
  }> {
    const details: {
      date?: string;
      rckik?: string;
      type?: string;
      quantity?: string;
      notes?: string;
    } = {};

    // Extract date from message
    const message = await this.modal.locator('p').first().textContent();
    const dateMatch = message?.match(/(\d{2}\.\d{2}\.\d{4})/);
    if (dateMatch) {
      details.date = dateMatch[1];
    }

    // Extract RCKiK from message
    const rckikMatch = message?.match(/centrum\s+(.+?)\s*\?/);
    if (rckikMatch) {
      details.rckik = rckikMatch[1].trim();
    }

    // Extract details from gray box
    const detailsBox = this.donationDetails;

    // Type
    const typeRow = detailsBox.locator('text=Typ:').locator('..');
    if (await typeRow.isVisible()) {
      const typeText = await typeRow.locator('dd').textContent();
      if (typeText) details.type = typeText.trim();
    }

    // Quantity
    const quantityRow = detailsBox.locator('text=Ilość:').locator('..');
    if (await quantityRow.isVisible()) {
      const quantityText = await quantityRow.locator('dd').textContent();
      if (quantityText) details.quantity = quantityText.trim();
    }

    // Notes (if present)
    const notesRow = detailsBox.locator('text=Notatki:').locator('..');
    if (await notesRow.isVisible()) {
      const notesText = await notesRow.locator('dd').textContent();
      if (notesText) details.notes = notesText.trim();
    }

    return details;
  }

  /**
   * Check if confirm button is disabled (deletion in progress)
   */
  async isConfirmButtonDisabled(): Promise<boolean> {
    return await this.confirmButton.isDisabled();
  }

  /**
   * Check if modal is in deleting state
   */
  async isDeletionInProgress(): Promise<boolean> {
    const isDisabled = await this.confirmButton.isDisabled();
    const hasLoadingClass = await this.confirmButton.evaluate(
      (el) => el.classList.contains('loading') || el.getAttribute('aria-busy') === 'true'
    );

    return isDisabled || hasLoadingClass;
  }

  /**
   * Verify modal displays correct donation information
   *
   * @param expectedData - Expected donation data to verify
   * @returns true if all expected data matches
   */
  async verifyDonationData(expectedData: {
    date?: string;
    rckik?: string;
    type?: string;
    quantity?: string;
  }): Promise<boolean> {
    const actualData = await this.getDonationDetails();

    if (expectedData.date && actualData.date !== expectedData.date) {
      return false;
    }

    if (expectedData.rckik && !actualData.rckik?.includes(expectedData.rckik)) {
      return false;
    }

    if (expectedData.type && actualData.type !== expectedData.type) {
      return false;
    }

    if (expectedData.quantity && actualData.quantity !== expectedData.quantity) {
      return false;
    }

    return true;
  }

  /**
   * Test cancel functionality
   *
   * Opens modal, cancels, verifies modal closes without deletion
   */
  async testCancelFunctionality(): Promise<boolean> {
    const isOpen = await this.modal.isVisible();
    if (!isOpen) return false;

    await this.cancelDelete();

    // Modal should be closed
    return !(await this.modal.isVisible());
  }

  /**
   * Test ESC key closes modal
   */
  async testEscKeyCloses(): Promise<boolean> {
    const isOpen = await this.modal.isVisible();
    if (!isOpen) return false;

    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);

    // Modal should be closed
    return !(await this.modal.isVisible());
  }
}
