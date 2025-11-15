import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for Login Page
 * Covers US-001, US-002 (Authentication scenarios)
 *
 * Features:
 * - Email and password login
 * - Remember me functionality
 * - Rate limiting (5 attempts → 5 min lockout)
 * - CAPTCHA after 3 failed attempts
 * - Error message handling
 */
export class LoginPage extends BasePage {
  // Form locators
  readonly loginForm: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly submitButton: Locator;
  readonly captchaInput: Locator;

  // Error/Success message locators
  readonly errorMessage: Locator;
  readonly rateLimitNotice: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators using data-test-id attributes
    this.loginForm = page.getByTestId('login-form');
    this.emailInput = page.getByTestId('login-email-input').locator('input');
    this.passwordInput = page.getByTestId('login-password-input').locator('input');
    this.rememberMeCheckbox = page.getByTestId('login-remember-me-checkbox').locator('input');
    this.submitButton = page.getByTestId('login-submit-button').locator('button');
    this.captchaInput = page.getByTestId('login-captcha-input');
    this.errorMessage = page.getByTestId('login-error-message');
    this.rateLimitNotice = page.getByTestId('login-rate-limit-notice');
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await super.goto('/login');
    await this.waitForPageLoad();
  }

  /**
   * Fill login form
   * @param email - User email
   * @param password - User password
   * @param rememberMe - Remember me checkbox state (default: false)
   */
  async fillLoginForm(email: string, password: string, rememberMe: boolean = false) {
    await this.fillInput(this.emailInput, email);
    await this.fillInput(this.passwordInput, password);

    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }
  }

  /**
   * Submit login form
   */
  async submitLogin() {
    await this.clickButton(this.submitButton);
  }

  /**
   * Complete login flow
   * @param email - User email
   * @param password - User password
   * @param rememberMe - Remember me checkbox state (default: false)
   */
  async login(email: string, password: string, rememberMe: boolean = false) {
    await this.fillLoginForm(email, password, rememberMe);
    await this.submitLogin();
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
   * Check if rate limit notice is displayed
   */
  async isRateLimited(): Promise<boolean> {
    return await this.rateLimitNotice.isVisible();
  }

  /**
   * Check if CAPTCHA is displayed
   */
  async isCaptchaDisplayed(): Promise<boolean> {
    return await this.captchaInput.isVisible();
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Wait for successful redirect after login
   * @param expectedUrl - Expected URL after login (default: /dashboard)
   */
  async waitForLoginRedirect(expectedUrl: string = '/dashboard') {
    await this.page.waitForURL(expectedUrl, { timeout: 10000 });
  }
}
