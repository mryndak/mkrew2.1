import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for Email Verification Page
 * Covers US-003 (Email verification after registration)
 *
 * Features:
 * - Automatic verification with token from URL
 * - Multiple verification states (loading, success, error, expired, etc.)
 * - Redirect to login after successful verification
 * - Resend verification email functionality
 * - Error handling for various scenarios
 *
 * Verification states:
 * - loading: Token verification in progress
 * - success: Email verified successfully
 * - expired: Verification token expired (>24h)
 * - already_verified: Email already verified (idempotency)
 * - invalid: Invalid or malformed token
 * - missing_token: No token in URL
 * - error: Network or server error
 */
export class VerificationPage extends BasePage {
  // Loading state
  readonly loadingSpinner: Locator;
  readonly loadingHeading: Locator;

  // Success state
  readonly successIcon: Locator;
  readonly successHeading: Locator;
  readonly successMessage: Locator;
  readonly loginRedirectButton: Locator;

  // Error state (generic)
  readonly errorIcon: Locator;
  readonly errorHeading: Locator;
  readonly errorMessage: Locator;
  readonly errorActionButton: Locator;

  // Expired state
  readonly expiredIcon: Locator;
  readonly expiredHeading: Locator;
  readonly expiredMessage: Locator;
  readonly resendButton: Locator;

  // Already verified state
  readonly alreadyVerifiedHeading: Locator;
  readonly alreadyVerifiedLoginButton: Locator;

  constructor(page: Page) {
    super(page);

    // Loading state locators
    this.loadingSpinner = page.locator('.animate-spin');
    this.loadingHeading = page.locator('h1:has-text("Weryfikacja w toku")');

    // Success state locators
    this.successIcon = page.locator('svg.text-green-500');
    this.successHeading = page.locator('h1:has-text("Email zweryfikowany pomyślnie")');
    this.successMessage = page.locator('p:has-text("został zweryfikowany")');
    this.loginRedirectButton = page.locator('button:has-text("Przejdź do logowania")');

    // Error state locators
    this.errorIcon = page.locator('svg.text-red-500');
    this.errorHeading = page.locator('h1').first();
    this.errorMessage = page.locator('p.text-gray-600');
    this.errorActionButton = page.locator('button').first();

    // Expired state locators
    this.expiredIcon = page.locator('svg.text-orange-500');
    this.expiredHeading = page.locator('h1:has-text("Token weryfikacyjny wygasł")');
    this.expiredMessage = page.locator('p:has-text("Link weryfikacyjny stracił ważność")');
    this.resendButton = page.locator('button:has-text("Wyślij ponownie")');

    // Already verified state locators
    this.alreadyVerifiedHeading = page.locator('h1:has-text("Email został już zweryfikowany")');
    this.alreadyVerifiedLoginButton = page.locator('button:has-text("Przejdź do logowania")');
  }

  /**
   * Navigate to verification page with token
   * @param token - Verification token from email
   */
  async gotoWithToken(token: string) {
    await super.goto(`/verify-email?token=${token}`);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to verification page without token
   */
  async goto() {
    await super.goto('/verify-email');
    await this.waitForPageLoad();
  }

  /**
   * Check if page is in loading state
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingSpinner.isVisible();
  }

  /**
   * Check if verification was successful
   */
  async isSuccess(): Promise<boolean> {
    return await this.successHeading.isVisible();
  }

  /**
   * Check if token is expired
   */
  async isExpired(): Promise<boolean> {
    return await this.expiredHeading.isVisible();
  }

  /**
   * Check if email is already verified
   */
  async isAlreadyVerified(): Promise<boolean> {
    return await this.alreadyVerifiedHeading.isVisible();
  }

  /**
   * Check if there's an error state
   */
  async hasError(): Promise<boolean> {
    return await this.errorIcon.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  /**
   * Get success message with email
   */
  async getSuccessMessage(): Promise<string> {
    return await this.successMessage.textContent() || '';
  }

  /**
   * Click redirect to login button (from success or already verified state)
   */
  async clickGoToLogin() {
    const isSuccess = await this.isSuccess();
    const isAlreadyVerified = await this.isAlreadyVerified();

    if (isSuccess) {
      await this.clickButton(this.loginRedirectButton);
    } else if (isAlreadyVerified) {
      await this.clickButton(this.alreadyVerifiedLoginButton);
    }
  }

  /**
   * Click resend verification email button (from expired state)
   */
  async clickResend() {
    await this.clickButton(this.resendButton);
  }

  /**
   * Click error action button (retry, go to register, etc.)
   */
  async clickErrorAction() {
    await this.clickButton(this.errorActionButton);
  }

  /**
   * Wait for verification to complete (either success or error)
   * @param timeout - Timeout in milliseconds (default: 10000)
   */
  async waitForVerificationComplete(timeout: number = 10000) {
    await this.page.waitForFunction(
      () => {
        const successVisible = document.querySelector('h1:has-text("Email zweryfikowany pomyślnie")')?.isConnected;
        const errorVisible = document.querySelector('svg.text-red-500')?.isConnected;
        const expiredVisible = document.querySelector('h1:has-text("Token weryfikacyjny wygasł")')?.isConnected;
        return successVisible || errorVisible || expiredVisible;
      },
      { timeout }
    );
  }

  /**
   * Wait for redirect to login page after successful verification
   */
  async waitForLoginRedirect() {
    await this.page.waitForURL(/\/login/, { timeout: 10000 });
  }

  /**
   * Get verified email from success message
   */
  async getVerifiedEmail(): Promise<string | null> {
    const message = await this.getSuccessMessage();
    const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    return emailMatch ? emailMatch[0] : null;
  }

  /**
   * Check if missing token error is displayed
   */
  async isMissingToken(): Promise<boolean> {
    const heading = await this.errorHeading.textContent();
    return heading?.includes('Brakuje tokenu weryfikacyjnego') || false;
  }

  /**
   * Check if invalid token error is displayed
   */
  async isInvalidToken(): Promise<boolean> {
    const heading = await this.errorHeading.textContent();
    return heading?.includes('Token weryfikacyjny jest nieprawidłowy') || false;
  }

  /**
   * Check if server error is displayed
   */
  async isServerError(): Promise<boolean> {
    const heading = await this.errorHeading.textContent();
    return heading?.includes('Błąd serwera') || false;
  }
}
