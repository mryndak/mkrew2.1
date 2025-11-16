import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Page Object for Admin Login Page
 *
 * Odpowiada za logowanie administratora do panelu administracyjnego.
 *
 * @example
 * ```ts
 * const adminLoginPage = new AdminLoginPage(page);
 * await adminLoginPage.goto();
 * await adminLoginPage.login('admin@example.com', 'password123');
 * ```
 */
export class AdminLoginPage extends BasePage {
  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators using data-testid
    this.emailInput = this.getByTestId('login-email-input');
    this.passwordInput = this.getByTestId('login-password-input');
    this.loginButton = this.getByTestId('login-submit-button');
    this.errorMessage = this.getByTestId('login-error-message');
    this.forgotPasswordLink = this.getByTestId('forgot-password-link');
  }

  /**
   * Navigate to admin login page
   */
  async goto() {
    await super.goto('/login');
    await this.waitForPageLoad();
  }

  /**
   * Login with credentials
   * @param email - Email address
   * @param password - Password
   */
  async login(email: string, password: string) {
    await this.fillInput(this.emailInput, email);
    await this.fillInput(this.passwordInput, password);
    await this.clickButton(this.loginButton);
  }

  /**
   * Check if error message is visible
   * @returns True if error message is displayed
   */
  async hasErrorMessage(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get error message text
   * @returns Error message content
   */
  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword() {
    await this.clickButton(this.forgotPasswordLink);
  }

  /**
   * Wait for successful login redirect
   * @param expectedUrl - Expected URL after login (default: /admin)
   */
  async waitForLoginSuccess(expectedUrl: string = '/admin') {
    await this.page.waitForURL(expectedUrl, { timeout: 10000 });
  }
}
