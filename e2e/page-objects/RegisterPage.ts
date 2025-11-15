import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for Registration Page
 * Covers US-003 (User registration with multi-step form)
 *
 * Features:
 * - Multi-step registration (3 steps)
 * - Email uniqueness validation
 * - Password strength validation
 * - Consent management
 * - Personal data collection
 * - Favorite RCKiK selection (optional)
 * - Draft persistence to sessionStorage
 */
export class RegisterPage extends BasePage {
  // Progress bar
  readonly progressBar: Locator;

  // Global elements
  readonly globalError: Locator;

  // Step 1: Email, Password, Consent
  readonly step1Header: Locator;
  readonly emailInput: Locator;
  readonly emailError: Locator;
  readonly passwordInput: Locator;
  readonly passwordError: Locator;
  readonly passwordToggle: Locator;
  readonly confirmPasswordInput: Locator;
  readonly confirmPasswordError: Locator;
  readonly confirmPasswordToggle: Locator;
  readonly consentCheckbox: Locator;
  readonly consentError: Locator;
  readonly marketingCheckbox: Locator;
  readonly step1NextButton: Locator;

  // Step 2: Personal Data
  readonly step2Header: Locator;
  readonly firstNameInput: Locator;
  readonly firstNameError: Locator;
  readonly lastNameInput: Locator;
  readonly lastNameError: Locator;
  readonly bloodGroupSelect: Locator;
  readonly step2PreviousButton: Locator;
  readonly step2NextButton: Locator;

  // Step 3: Favorite RCKiK
  readonly step3Header: Locator;
  readonly rckikSearchInput: Locator;
  readonly step3PreviousButton: Locator;
  readonly step3SubmitButton: Locator;
  readonly step3SkipButton: Locator;

  constructor(page: Page) {
    super(page);

    // Progress bar
    this.progressBar = page.locator('[class*="progress"]');

    // Global elements
    this.globalError = page.locator('[class*="error"]:has-text("błąd")').first();

    // Step 1 locators
    this.step1Header = page.getByTestId('register-step1-header');
    this.emailInput = page.getByTestId('register-email-input');
    this.emailError = page.getByTestId('register-email-error');
    this.passwordInput = page.getByTestId('register-password-input');
    this.passwordError = page.getByTestId('register-password-error');
    this.passwordToggle = page.getByTestId('register-password-toggle');
    this.confirmPasswordInput = page.getByTestId('register-confirm-password-input');
    this.confirmPasswordError = page.getByTestId('register-confirm-password-error');
    this.confirmPasswordToggle = page.getByTestId('register-confirm-password-toggle');
    this.consentCheckbox = page.getByTestId('register-consent-checkbox');
    this.consentError = page.getByTestId('register-consent-error');
    this.marketingCheckbox = page.getByTestId('register-marketing-checkbox');
    this.step1NextButton = page.getByTestId('register-step1-next-button');

    // Step 2 locators
    this.step2Header = page.getByTestId('register-step2-header');
    this.firstNameInput = page.getByTestId('register-first-name-input');
    this.firstNameError = page.getByTestId('register-first-name-error');
    this.lastNameInput = page.getByTestId('register-last-name-input');
    this.lastNameError = page.getByTestId('register-last-name-error');
    this.bloodGroupSelect = page.getByTestId('blood-group-select');
    this.step2PreviousButton = page.getByTestId('register-step2-previous-button');
    this.step2NextButton = page.getByTestId('register-step2-next-button');

    // Step 3 locators
    this.step3Header = page.getByTestId('register-step3-header');
    this.rckikSearchInput = page.getByTestId('register-rckik-search-input');
    this.step3PreviousButton = page.getByTestId('register-step3-previous-button');
    this.step3SubmitButton = page.getByTestId('register-step3-submit-button');
    this.step3SkipButton = page.getByTestId('register-step3-skip-button');
  }

  /**
   * Navigate to registration page
   */
  async goto() {
    await super.goto('/register');
    await this.waitForPageLoad();
  }

  /**
   * Check if currently on Step 1
   */
  async isOnStep1(): Promise<boolean> {
    return await this.step1Header.isVisible();
  }

  /**
   * Check if currently on Step 2
   */
  async isOnStep2(): Promise<boolean> {
    return await this.step2Header.isVisible();
  }

  /**
   * Check if currently on Step 3
   */
  async isOnStep3(): Promise<boolean> {
    return await this.step3Header.isVisible();
  }

  /**
   * Fill Step 1: Email, Password, Consent
   * @param email - User email
   * @param password - User password
   * @param confirmPassword - Password confirmation
   * @param consent - Privacy policy consent (required)
   * @param marketing - Marketing consent (optional)
   */
  async fillStep1(
    email: string,
    password: string,
    confirmPassword: string,
    consent: boolean = true,
    marketing: boolean = false
  ) {
    await this.fillInput(this.emailInput, email);
    await this.fillInput(this.passwordInput, password);
    await this.fillInput(this.confirmPasswordInput, confirmPassword);

    if (consent) {
      await this.consentCheckbox.check();
    }

    if (marketing) {
      await this.marketingCheckbox.check();
    }
  }

  /**
   * Go to Step 2 from Step 1
   */
  async goToStep2() {
    await this.clickButton(this.step1NextButton);
    await this.waitForElement(this.step2Header);
  }

  /**
   * Fill Step 2: Personal Data
   * @param firstName - User first name
   * @param lastName - User last name
   * @param bloodGroup - Blood group (optional)
   */
  async fillStep2(firstName: string, lastName: string, bloodGroup?: string) {
    await this.fillInput(this.firstNameInput, firstName);
    await this.fillInput(this.lastNameInput, lastName);

    if (bloodGroup) {
      await this.bloodGroupSelect.selectOption(bloodGroup);
    }
  }

  /**
   * Go to Step 3 from Step 2
   */
  async goToStep3() {
    await this.clickButton(this.step2NextButton);
    await this.waitForElement(this.step3Header);
  }

  /**
   * Go back to Step 1 from Step 2
   */
  async backToStep1() {
    await this.clickButton(this.step2PreviousButton);
    await this.waitForElement(this.step1Header);
  }

  /**
   * Go back to Step 2 from Step 3
   */
  async backToStep2() {
    await this.clickButton(this.step3PreviousButton);
    await this.waitForElement(this.step2Header);
  }

  /**
   * Search for RCKiK in Step 3
   * @param searchTerm - Search term (city or name)
   */
  async searchRckik(searchTerm: string) {
    await this.fillInput(this.rckikSearchInput, searchTerm);
  }

  /**
   * Select RCKiK by name in Step 3
   * @param rckikName - Name of RCKiK to select
   */
  async selectRckik(rckikName: string) {
    const checkbox = this.page.locator(`input[type="checkbox"][aria-label*="${rckikName}"]`);
    await checkbox.check();
  }

  /**
   * Submit registration (from Step 3)
   */
  async submitRegistration() {
    await this.clickButton(this.step3SubmitButton);
  }

  /**
   * Skip Step 3 and submit
   */
  async skipStep3() {
    await this.clickButton(this.step3SkipButton);
  }

  /**
   * Complete full registration flow
   * @param userData - User registration data
   */
  async completeRegistration(userData: {
    email: string;
    password: string;
    confirmPassword?: string;
    firstName: string;
    lastName: string;
    bloodGroup?: string;
    consent?: boolean;
    marketing?: boolean;
    skipRckik?: boolean;
  }) {
    // Step 1
    await this.fillStep1(
      userData.email,
      userData.password,
      userData.confirmPassword || userData.password,
      userData.consent !== false,
      userData.marketing || false
    );
    await this.goToStep2();

    // Step 2
    await this.fillStep2(userData.firstName, userData.lastName, userData.bloodGroup);
    await this.goToStep3();

    // Step 3
    if (userData.skipRckik) {
      await this.skipStep3();
    } else {
      await this.submitRegistration();
    }
  }

  /**
   * Check if email error is displayed
   */
  async hasEmailError(): Promise<boolean> {
    return await this.emailError.isVisible();
  }

  /**
   * Check if password error is displayed
   */
  async hasPasswordError(): Promise<boolean> {
    return await this.passwordError.isVisible();
  }

  /**
   * Check if consent error is displayed
   */
  async hasConsentError(): Promise<boolean> {
    return await this.consentError.isVisible();
  }

  /**
   * Wait for successful redirect after registration
   * @param expectedUrl - Expected URL after registration (default: /verify-email-pending)
   */
  async waitForRegistrationRedirect(expectedUrl: string = '/verify-email-pending') {
    await this.page.waitForURL(expectedUrl, { timeout: 10000 });
  }

  /**
   * Toggle password visibility in Step 1
   */
  async togglePasswordVisibility() {
    await this.passwordToggle.click();
  }

  /**
   * Toggle confirm password visibility in Step 1
   */
  async toggleConfirmPasswordVisibility() {
    await this.confirmPasswordToggle.click();
  }
}
