import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for Home/Landing Page
 */
export class HomePage extends BasePage {
  // Locators
  readonly heading: Locator;
  readonly rckikListLink: Locator;
  readonly loginLink: Locator;
  readonly registerLink: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.heading = page.locator('h1').first();
    this.rckikListLink = page.locator('a[href="/rckik"]');
    this.loginLink = page.locator('a[href="/login"]');
    this.registerLink = page.locator('a[href="/register"]');
    this.searchInput = page.locator('input[name="search"]');
    this.searchButton = this.getByTestId('search-button');
  }

  /**
   * Navigate to home page
   */
  async goto() {
    await super.goto('/');
    await this.waitForPageLoad();
  }

  /**
   * Navigate to RCKiK list
   */
  async navigateToRCKiKList() {
    await this.clickButton(this.rckikListLink);
  }

  /**
   * Navigate to login page
   */
  async navigateToLogin() {
    await this.clickButton(this.loginLink);
  }

  /**
   * Navigate to registration page
   */
  async navigateToRegister() {
    await this.clickButton(this.registerLink);
  }

  /**
   * Search for blood center
   */
  async searchRCKiK(query: string) {
    await this.fillInput(this.searchInput, query);
    await this.clickButton(this.searchButton);
  }

  /**
   * Get page title
   */
  async getPageTitle(): Promise<string> {
    return await this.heading.textContent() || '';
  }
}
