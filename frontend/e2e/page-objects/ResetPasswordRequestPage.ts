import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for Reset Password Request Page
 * Covers US-004 (Password reset flow - request step)
 *
 * Features:
 * - Email input for password reset
 * - Rate limiting (3 requests per email per hour)
 * - Success message display
 * - Error handling
 * - Security: doesn't reveal if email exists
 */
export class ResetPasswordRequestPage extends BasePage {
  // Form locators
  readonly resetRequestForm: Locator;
  readonly emailInput: Locator;
  readonly submitButton: Locator;

  // Message locators
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  // Action locators (in success state)
  readonly resendButton: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators using data-test-id attributes
    this.resetRequestForm = page.getByTestId('reset-request-form');
    this.emailInput = page.getByTestId('reset-request-email-input').locator('input');
    this.submitButton = page.getByTestId('reset-request-submit-button');
    this.errorMessage = page.getByTestId('reset-request-error');
    this.successMessage = page.getByTestId('reset-request-success-message');
    this.resendButton = page.locator('button:has-text("Wyślij ponownie")');
  }

  /**
   * Navigate to reset password request page
   */
  async goto() {
    await super.goto('/reset-password');
    await this.waitForPageLoad();
  }

  /**
   * Fill email input
   * @param email - User email
   */
  async fillEmail(email: string) {
    await this.fillInput(this.emailInput, email);
  }

  /**
   * Submit reset request form
   */
  async submitRequest() {
    await this.clickButton(this.submitButton);
  }

  /**
   * Complete password reset request flow
   * @param email - User email
   */
  async requestPasswordReset(email: string) {
    await this.fillEmail(email);
    await this.submitRequest();
  }

  /**
   * Check if success message is displayed
   */
  async hasSuccessMessage(): Promise<boolean> {
    return await this.successMessage.isVisible();
  }

  /**
   * Get success message text
   */
  async getSuccessMessage(): Promise<string> {
    return await this.successMessage.textContent() || '';
  }

  /**
   * Check if error message is displayed
   */
  async hasErrorMessage(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Click resend button (available after successful submission)
   */
  async clickResend() {
    await this.clickButton(this.resendButton);
  }

  /**
   * Wait for success message to appear
   * @param timeout - Timeout in milliseconds (default: 5000)
   */
  async waitForSuccessMessage(timeout: number = 5000) {
    await this.waitForElement(this.successMessage, timeout);
  }

  /**
   * Wait for error message to appear
   * @param timeout - Timeout in milliseconds (default: 5000)
   */
  async waitForErrorMessage(timeout: number = 5000) {
    await this.waitForElement(this.errorMessage, timeout);
  }

  /**
   * Check if form is in success state (form hidden, success message shown)
   */
  async isInSuccessState(): Promise<boolean> {
    const formVisible = await this.resetRequestForm.isVisible();
    const successVisible = await this.successMessage.isVisible();
    return !formVisible && successVisible;
  }

  /**
   * Check if rate limit error is displayed
   */
  async isRateLimited(): Promise<boolean> {
    const errorText = await this.getErrorMessage();
    return errorText.toLowerCase().includes('zbyt wiele prób');
  }
}
