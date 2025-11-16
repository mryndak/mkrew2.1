import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for RCKiK List Page (/rckik)
 * Tests: Lista centrów krwiodawstwa with filters, search, and pagination
 *
 * Updated based on actual implementation:
 * - SearchBar component (id="rckik-search")
 * - FiltersPanel component (sortBy, sortOrder, reset)
 * - RckikList component (grid with RckikCard components)
 * - Pagination component (Previous/Next, page numbers, page size)
 * - NO city filter in current implementation
 */
export class RckikListPage extends BasePage {
  // Header elements
  readonly pageHeading: Locator;
  readonly pageDescription: Locator;

  // Search
  readonly searchInput: Locator;
  readonly searchClearButton: Locator;
  readonly searchLoadingIndicator: Locator;

  // Filters Panel
  readonly filtersPanelButton: Locator; // Mobile: "Filtry" button
  readonly filtersPanelDrawer: Locator; // Mobile drawer
  readonly filtersPanelClose: Locator; // Mobile close button
  readonly sortByFilter: Locator; // Select for sortBy
  readonly sortOrderToggle: Locator; // Button for ASC/DESC
  readonly resetFiltersButton: Locator; // Reset button

  // Results info
  readonly resultsCount: Locator;

  // RCKiK list
  readonly rckikCards: Locator;
  readonly firstRckikCard: Locator;
  readonly emptyState: Locator;
  readonly errorState: Locator;
  readonly loadingState: Locator; // SkeletonList

  // Pagination
  readonly paginationNav: Locator;
  readonly paginationPrevious: Locator;
  readonly paginationNext: Locator;
  readonly paginationPageNumbers: Locator;
  readonly pageSizeSelector: Locator;

  constructor(page: Page) {
    super(page);

    // Header - based on index.astro
    this.pageHeading = page.locator('h1').filter({ hasText: 'Centra krwiodawstwa' });
    this.pageDescription = page.locator('p').filter({ hasText: 'Przeglądaj aktualne stany' });

    // Search - based on SearchBar.tsx
    this.searchInput = page.locator('input#rckik-search');
    this.searchClearButton = page.locator('button[aria-label="Wyczyść wyszukiwanie"]');
    this.searchLoadingIndicator = page.locator('p:has-text("Wyszukiwanie...")');

    // Filters Panel - based on FiltersPanel.tsx and RckikListApp.tsx
    this.filtersPanelButton = page.locator('button:has-text("Filtry")');
    this.filtersPanelDrawer = page.locator('aside[aria-label="Filtry listy centrów"]');
    this.filtersPanelClose = page.locator('button[aria-label="Zamknij panel filtrów"]');

    // FiltersPanel components
    this.sortByFilter = page.locator('select').first(); // Select for sortBy (Nazwa/Miasto/Kod)
    this.sortOrderToggle = page.locator('button[aria-label*="Sortowanie"]');
    this.resetFiltersButton = page.locator('button:has-text("Resetuj filtry")');

    // Results count - based on Pagination.tsx
    this.resultsCount = page.locator('nav[aria-label*="Paginacja"] div.text-sm');

    // RCKiK list - based on RckikList.tsx
    this.rckikCards = page.locator('article.card');
    this.firstRckikCard = this.rckikCards.first();
    this.emptyState = page.locator('text="Nie znaleziono centrów"');
    this.errorState = page.locator('text=/Wystąpił błąd|Error/i');
    this.loadingState = page.locator('[role="status"]'); // SkeletonList uses role="status"

    // Pagination - based on Pagination.tsx
    this.paginationNav = page.locator('nav[aria-label*="Paginacja"]');
    this.paginationPrevious = page.locator('button[aria-label="Poprzednia strona"]');
    this.paginationNext = page.locator('button[aria-label="Następna strona"]');
    this.paginationPageNumbers = page.locator('button[aria-label*="Strona"]');
    this.pageSizeSelector = page.locator('select#page-size');
  }

  /**
   * Navigate to RCKiK list page
   */
  async goto() {
    await super.goto('/rckik');
    await this.waitForPageLoad();
  }

  /**
   * Wait for RCKiK cards to load
   */
  async waitForRckikCards() {
    await this.rckikCards.first().waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Get total number of RCKiK cards displayed
   */
  async getRckikCardsCount(): Promise<number> {
    return await this.rckikCards.count();
  }

  /**
   * Search for RCKiK by name
   */
  async searchByName(query: string) {
    await this.fillInput(this.searchInput, query);
    // Wait for debounce (500ms in SearchBar.tsx)
    await this.page.waitForTimeout(600);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Clear search input
   */
  async clearSearch() {
    const isVisible = await this.searchClearButton.isVisible().catch(() => false);
    if (isVisible) {
      await this.clickButton(this.searchClearButton);
    } else {
      await this.searchInput.clear();
    }
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Open filters panel (mobile)
   */
  async openFiltersPanel() {
    const isButtonVisible = await this.filtersPanelButton.isVisible().catch(() => false);
    if (isButtonVisible) {
      await this.clickButton(this.filtersPanelButton);
      await this.filtersPanelDrawer.waitFor({ state: 'visible' });
    }
  }

  /**
   * Close filters panel (mobile)
   */
  async closeFiltersPanel() {
    const isCloseVisible = await this.filtersPanelClose.isVisible().catch(() => false);
    if (isCloseVisible) {
      await this.clickButton(this.filtersPanelClose);
    }
  }

  /**
   * Select sort by option
   */
  async sortBy(option: 'name' | 'city' | 'code') {
    await this.sortByFilter.selectOption({ value: option });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Toggle sort order (ASC/DESC)
   */
  async toggleSortOrder() {
    await this.clickButton(this.sortOrderToggle);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Reset all filters
   */
  async resetFilters() {
    await this.clickButton(this.resetFiltersButton);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click on first RCKiK card
   */
  async clickFirstRckikCard() {
    await this.clickButton(this.firstRckikCard);
  }

  /**
   * Click on RCKiK card by index
   */
  async clickRckikCardByIndex(index: number) {
    await this.clickButton(this.rckikCards.nth(index));
  }

  /**
   * Click on RCKiK card by name
   */
  async clickRckikCardByName(name: string) {
    const card = this.rckikCards.filter({ hasText: name });
    await this.clickButton(card);
  }

  /**
   * Get RCKiK card name by index
   */
  async getRckikCardName(index: number): Promise<string> {
    const card = this.rckikCards.nth(index);
    const nameElement = card.locator('h2').first();
    return (await nameElement.textContent()) || '';
  }

  /**
   * Get all blood level badges for a specific card
   */
  async getBloodLevelBadgesCount(cardIndex: number): Promise<number> {
    const card = this.rckikCards.nth(cardIndex);
    // BloodLevelBadge components are in a grid
    const badges = card.locator('[class*="grid"] > div');
    return await badges.count();
  }

  /**
   * Verify if specific blood group badge is visible in card
   */
  async isBloodGroupVisible(cardIndex: number, bloodGroup: string): Promise<boolean> {
    const card = this.rckikCards.nth(cardIndex);
    const badge = card.locator(`text="${bloodGroup}"`);
    return await badge.isVisible();
  }

  /**
   * Get results count text
   */
  async getResultsCountText(): Promise<string> {
    return (await this.resultsCount.textContent()) || '';
  }

  /**
   * Navigate to next page
   */
  async goToNextPage() {
    await this.clickButton(this.paginationNext);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to previous page
   */
  async goToPreviousPage() {
    await this.clickButton(this.paginationPrevious);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Select page size
   */
  async selectPageSize(size: number) {
    await this.pageSizeSelector.selectOption(size.toString());
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if empty state is visible
   */
  async isEmptyStateVisible(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  /**
   * Check if error state is visible
   */
  async isErrorStateVisible(): Promise<boolean> {
    return await this.errorState.isVisible();
  }

  /**
   * Check if loading state is visible
   */
  async isLoadingStateVisible(): Promise<boolean> {
    return await this.loadingState.isVisible();
  }

  /**
   * Verify all key elements are rendered on the page
   */
  async verifyAllElementsRendered(): Promise<void> {
    await this.waitForElement(this.pageHeading);
    await this.waitForElement(this.searchInput);
    await this.waitForRckikCards();
  }

  /**
   * Get current URL with query params
   */
  getUrlWithParams(): string {
    return this.getCurrentUrl();
  }

  /**
   * Verify URL contains specific query param
   */
  async verifyUrlParam(param: string, value: string): Promise<boolean> {
    const url = new URL(this.getCurrentUrl());
    return url.searchParams.get(param) === value;
  }

  /**
   * Get last update timestamp from first card
   */
  async getFirstCardLastUpdate(): Promise<string> {
    const card = this.firstRckikCard;
    const timeElement = card.locator('time');
    return (await timeElement.textContent()) || '';
  }

  /**
   * Check if card has address visible
   */
  async isCardAddressVisible(cardIndex: number): Promise<boolean> {
    const card = this.rckikCards.nth(cardIndex);
    const address = card.locator('address');
    return await address.isVisible();
  }
}
