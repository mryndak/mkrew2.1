import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for Notifications Page (Dashboard)
 *
 * Covers:
 * - US-011: Powiadomienia in-app
 * - TC-NOTIF-03: Sprawdzenie wyświetlania i oznaczania powiadomień in-app
 *
 * Features:
 * - Viewing all/unread notifications
 * - Marking notifications as read (single & bulk)
 * - Tab navigation (All / Unread)
 * - Pagination (Load More)
 * - Empty states
 * - Error handling
 */
export class NotificationsPage extends BasePage {
  // Main container
  readonly container: Locator;
  readonly header: Locator;
  readonly headerTitle: Locator;

  // Tabs
  readonly tabsContainer: Locator;
  readonly tabAll: Locator;
  readonly tabUnread: Locator;
  readonly unreadBadge: Locator;

  // Mark all as read
  readonly markAllAsReadContainer: Locator;
  readonly markAllAsReadButton: Locator;

  // Notification list
  readonly notificationList: Locator;
  readonly notificationItems: Locator;

  // Empty states
  readonly emptyState: Locator;
  readonly loadingSkeleton: Locator;
  readonly errorState: Locator;
  readonly retryButton: Locator;

  // Load more
  readonly loadMoreButton: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators using data-testid
    this.container = this.getByTestId('notifications-view-container');
    this.header = this.getByTestId('notifications-view-header');
    this.headerTitle = this.header.locator('h1');

    // Tabs
    this.tabsContainer = this.getByTestId('notification-tabs-container');
    this.tabAll = this.getByTestId('notification-tab-all');
    this.tabUnread = this.getByTestId('notification-tab-unread');
    this.unreadBadge = this.getByTestId('notification-unread-badge');

    // Mark all as read
    this.markAllAsReadContainer = this.getByTestId('mark-all-as-read-container');
    this.markAllAsReadButton = this.markAllAsReadContainer.locator('button');

    // Notification list
    this.notificationList = this.getByTestId('notification-list');
    this.notificationItems = this.getByTestId('notification-item');

    // States
    this.emptyState = this.page.locator('[role="status"]').filter({ hasText: 'Brak powiadomień' });
    this.loadingSkeleton = this.getByTestId('notifications-loading-skeleton');
    this.errorState = this.getByTestId('notifications-error-state');
    this.retryButton = this.getByTestId('notifications-retry-button');

    // Pagination
    this.loadMoreButton = this.page.locator('button', { hasText: 'Załaduj więcej' });
  }

  /**
   * Navigate to notifications page
   */
  async goto() {
    await super.goto('/dashboard/notifications');
    await this.waitForPageLoad();
  }

  /**
   * Wait for notifications to load (skeleton disappears)
   */
  async waitForNotificationsLoad() {
    await this.loadingSkeleton.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Get all notification items
   */
  async getNotificationItems(): Promise<Locator[]> {
    const count = await this.notificationItems.count();
    const items: Locator[] = [];
    for (let i = 0; i < count; i++) {
      items.push(this.notificationItems.nth(i));
    }
    return items;
  }

  /**
   * Get notification by index (0-based)
   */
  getNotificationByIndex(index: number): Locator {
    return this.notificationItems.nth(index);
  }

  /**
   * Get notification by ID
   */
  getNotificationById(id: number): Locator {
    return this.page.locator(`[data-testid="notification-item"][data-notification-id="${id}"]`);
  }

  /**
   * Get unread notifications count from badge
   */
  async getUnreadCount(): Promise<number> {
    const isVisible = await this.unreadBadge.isVisible();
    if (!isVisible) {
      return 0;
    }
    const text = await this.unreadBadge.textContent();
    if (text === '99+') {
      return 99;
    }
    return parseInt(text || '0', 10);
  }

  /**
   * Get total notifications count
   */
  async getTotalNotificationsCount(): Promise<number> {
    return await this.notificationItems.count();
  }

  /**
   * Switch to "All" tab
   */
  async switchToAllTab() {
    await this.clickButton(this.tabAll);
    await this.waitForNotificationsLoad();
  }

  /**
   * Switch to "Unread" tab
   */
  async switchToUnreadTab() {
    await this.clickButton(this.tabUnread);
    await this.waitForNotificationsLoad();
  }

  /**
   * Get active tab ('all' or 'unread')
   */
  async getActiveTab(): Promise<'all' | 'unread'> {
    const allSelected = await this.tabAll.getAttribute('aria-selected');
    return allSelected === 'true' ? 'all' : 'unread';
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    await this.clickButton(this.markAllAsReadButton);
    // Wait for optimistic update (badge should disappear or become 0)
    await this.page.waitForTimeout(500);
  }

  /**
   * Mark single notification as read by index
   */
  async markNotificationAsReadByIndex(index: number) {
    const notification = this.getNotificationByIndex(index);
    const markAsReadBtn = notification.locator('[data-test-id="mark-as-read-button"]');
    await this.clickButton(markAsReadBtn);
    // Wait for optimistic update
    await this.page.waitForTimeout(500);
  }

  /**
   * Mark notification as read by ID
   */
  async markNotificationAsReadById(id: number) {
    const notification = this.getNotificationById(id);
    const markAsReadBtn = notification.locator('[data-test-id="mark-as-read-button"]');
    await this.clickButton(markAsReadBtn);
    // Wait for optimistic update
    await this.page.waitForTimeout(500);
  }

  /**
   * Click on notification (to navigate to linkUrl)
   */
  async clickNotification(index: number) {
    const notification = this.getNotificationByIndex(index);
    await this.clickButton(notification);
  }

  /**
   * Load more notifications (pagination)
   */
  async loadMore() {
    await this.clickButton(this.loadMoreButton);
    await this.page.waitForTimeout(1000); // Wait for new items to load
  }

  /**
   * Check if "Load More" button is visible
   */
  async hasMoreNotifications(): Promise<boolean> {
    return await this.loadMoreButton.isVisible();
  }

  /**
   * Check if notification is read
   */
  async isNotificationRead(index: number): Promise<boolean> {
    const notification = this.getNotificationByIndex(index);
    const readAttr = await notification.getAttribute('data-notification-read');
    return readAttr === 'true';
  }

  /**
   * Check if notification is unread
   */
  async isNotificationUnread(index: number): Promise<boolean> {
    return !(await this.isNotificationRead(index));
  }

  /**
   * Get notification title by index
   */
  async getNotificationTitle(index: number): Promise<string> {
    const notification = this.getNotificationByIndex(index);
    const title = notification.locator('[data-test-id="notification-title"]');
    return await title.textContent() || '';
  }

  /**
   * Get notification message by index
   */
  async getNotificationMessage(index: number): Promise<string> {
    const notification = this.getNotificationByIndex(index);
    const message = notification.locator('[data-test-id="notification-message"]');
    return await message.textContent() || '';
  }

  /**
   * Get notification RCKiK info by index
   */
  async getNotificationRCKiKInfo(index: number): Promise<string | null> {
    const notification = this.getNotificationByIndex(index);
    const rckikInfo = notification.locator('[data-test-id="notification-rckik-info"]');
    const isVisible = await rckikInfo.isVisible();
    if (!isVisible) {
      return null;
    }
    return await rckikInfo.textContent() || null;
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
   * Check if loading skeleton is visible
   */
  async isLoadingSkeletonVisible(): Promise<boolean> {
    return await this.loadingSkeleton.isVisible();
  }

  /**
   * Retry loading notifications (when error occurs)
   */
  async retryLoadNotifications() {
    await this.clickButton(this.retryButton);
    await this.waitForNotificationsLoad();
  }

  /**
   * Verify notifications page is loaded correctly
   */
  async verifyPageLoaded() {
    await expect(this.container).toBeVisible();
    await expect(this.headerTitle).toHaveText('Powiadomienia');
    await expect(this.tabsContainer).toBeVisible();
  }

  /**
   * Verify unread badge count matches expected value
   */
  async verifyUnreadBadgeCount(expectedCount: number) {
    if (expectedCount === 0) {
      await expect(this.unreadBadge).not.toBeVisible();
    } else {
      await expect(this.unreadBadge).toBeVisible();
      const displayText = expectedCount > 99 ? '99+' : expectedCount.toString();
      await expect(this.unreadBadge).toHaveText(displayText);
    }
  }

  /**
   * Verify notification at index is unread
   */
  async verifyNotificationIsUnread(index: number) {
    const notification = this.getNotificationByIndex(index);
    const readAttr = await notification.getAttribute('data-notification-read');
    expect(readAttr).toBe('false');

    // Verify visual indicators
    const title = notification.locator('[data-test-id="notification-title"]');
    await expect(title).toHaveCSS('font-weight', /^(700|bold)$/);
  }

  /**
   * Verify notification at index is read
   */
  async verifyNotificationIsRead(index: number) {
    const notification = this.getNotificationByIndex(index);
    const readAttr = await notification.getAttribute('data-notification-read');
    expect(readAttr).toBe('true');

    // Verify read indicator is visible
    const readIndicator = notification.locator('[data-test-id="notification-read-indicator"]');
    await expect(readIndicator).toBeVisible();
  }

  /**
   * Verify all notifications are read
   */
  async verifyAllNotificationsRead() {
    const count = await this.getTotalNotificationsCount();
    for (let i = 0; i < count; i++) {
      await this.verifyNotificationIsRead(i);
    }

    // Verify badge is hidden
    await expect(this.unreadBadge).not.toBeVisible();
  }

  /**
   * Get notification groups (grouped by date)
   */
  getNotificationGroups(): Locator {
    return this.getByTestId('notification-group');
  }

  /**
   * Get notification group by date label (e.g., "Dzisiaj", "Wczoraj")
   */
  getNotificationGroupByLabel(label: string): Locator {
    return this.page.locator(`[data-test-id="notification-group"]`, {
      has: this.page.locator(`[data-test-id="notification-group-header"]:has-text("${label}")`)
    });
  }

  /**
   * Verify notification group exists with label
   */
  async verifyGroupExists(label: string) {
    const group = this.getNotificationGroupByLabel(label);
    await expect(group).toBeVisible();
  }
}
