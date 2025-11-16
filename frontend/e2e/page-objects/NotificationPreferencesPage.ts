import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for Notification Preferences (in Profile Page)
 *
 * Covers:
 * - US-006: Ustawienia powiadomień
 * - TC-NOTIF-02: Zmiana preferencji powiadomień i weryfikacja
 *
 * Features:
 * - Email notifications settings (enabled/disabled + frequency)
 * - In-app notifications settings (enabled/disabled + frequency)
 * - Save preferences
 * - Validation
 *
 * Note: Notification preferences are part of the Profile page
 * Location: /dashboard/profil (in NotificationPreferencesForm component)
 */
export class NotificationPreferencesPage extends BasePage {
  // Main container
  readonly container: Locator;
  readonly form: Locator;

  // Email notifications
  readonly emailCheckbox: Locator;
  readonly emailFrequencySelect: Locator;

  // In-app notifications
  readonly inAppCheckbox: Locator;
  readonly inAppFrequencySelect: Locator;

  // Save button
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators using data-testid
    this.container = this.getByTestId('notification-preferences-container');
    this.form = this.getByTestId('notification-preferences-form');

    // Email settings
    this.emailCheckbox = this.getByTestId('email-notifications-checkbox');
    this.emailFrequencySelect = this.getByTestId('email-frequency-select');

    // In-app settings
    this.inAppCheckbox = this.getByTestId('in-app-notifications-checkbox');
    this.inAppFrequencySelect = this.getByTestId('in-app-frequency-select');

    // Save button
    this.saveButton = this.getByTestId('save-notification-preferences-button');
  }

  /**
   * Navigate to profile page (contains notification preferences)
   */
  async goto() {
    await super.goto('/dashboard/profil');
    await this.waitForPageLoad();
  }

  /**
   * Wait for notification preferences form to load
   */
  async waitForFormLoad() {
    await this.container.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Get email notifications enabled state
   */
  async isEmailNotificationsEnabled(): Promise<boolean> {
    return await this.emailCheckbox.isChecked();
  }

  /**
   * Get in-app notifications enabled state
   */
  async isInAppNotificationsEnabled(): Promise<boolean> {
    return await this.inAppCheckbox.isChecked();
  }

  /**
   * Enable email notifications
   */
  async enableEmailNotifications() {
    const isChecked = await this.emailCheckbox.isChecked();
    if (!isChecked) {
      await this.emailCheckbox.check();
    }
  }

  /**
   * Disable email notifications
   */
  async disableEmailNotifications() {
    const isChecked = await this.emailCheckbox.isChecked();
    if (isChecked) {
      await this.emailCheckbox.uncheck();
    }
  }

  /**
   * Enable in-app notifications
   */
  async enableInAppNotifications() {
    const isChecked = await this.inAppCheckbox.isChecked();
    if (!isChecked) {
      await this.inAppCheckbox.check();
    }
  }

  /**
   * Disable in-app notifications
   */
  async disableInAppNotifications() {
    const isChecked = await this.inAppCheckbox.isChecked();
    if (isChecked) {
      await this.inAppCheckbox.uncheck();
    }
  }

  /**
   * Set email notifications frequency
   * @param frequency - 'DISABLED' | 'ONLY_CRITICAL' | 'DAILY' | 'IMMEDIATE'
   */
  async setEmailFrequency(frequency: string) {
    await this.emailFrequencySelect.selectOption({ value: frequency });
  }

  /**
   * Set in-app notifications frequency
   * @param frequency - 'DISABLED' | 'ONLY_CRITICAL' | 'DAILY' | 'IMMEDIATE'
   */
  async setInAppFrequency(frequency: string) {
    await this.inAppFrequencySelect.selectOption({ value: frequency });
  }

  /**
   * Get current email frequency value
   */
  async getEmailFrequency(): Promise<string> {
    return await this.emailFrequencySelect.inputValue();
  }

  /**
   * Get current in-app frequency value
   */
  async getInAppFrequency(): Promise<string> {
    return await this.inAppFrequencySelect.inputValue();
  }

  /**
   * Check if email frequency select is disabled
   */
  async isEmailFrequencyDisabled(): Promise<boolean> {
    return await this.emailFrequencySelect.isDisabled();
  }

  /**
   * Check if in-app frequency select is disabled
   */
  async isInAppFrequencyDisabled(): Promise<boolean> {
    return await this.inAppFrequencySelect.isDisabled();
  }

  /**
   * Check if save button is disabled
   */
  async isSaveButtonDisabled(): Promise<boolean> {
    return await this.saveButton.isDisabled();
  }

  /**
   * Save notification preferences
   */
  async savePreferences() {
    await this.clickButton(this.saveButton);
    // Wait for save to complete (toast notification should appear)
    await this.page.waitForTimeout(1000);
  }

  /**
   * Configure email notifications
   * @param enabled - Enable/disable email notifications
   * @param frequency - Frequency setting (if enabled)
   */
  async configureEmailNotifications(enabled: boolean, frequency?: string) {
    if (enabled) {
      await this.enableEmailNotifications();
      if (frequency) {
        await this.setEmailFrequency(frequency);
      }
    } else {
      await this.disableEmailNotifications();
    }
  }

  /**
   * Configure in-app notifications
   * @param enabled - Enable/disable in-app notifications
   * @param frequency - Frequency setting (if enabled)
   */
  async configureInAppNotifications(enabled: boolean, frequency?: string) {
    if (enabled) {
      await this.enableInAppNotifications();
      if (frequency) {
        await this.setInAppFrequency(frequency);
      }
    } else {
      await this.disableInAppNotifications();
    }
  }

  /**
   * Configure all notification preferences at once
   */
  async configureAllPreferences(config: {
    email: { enabled: boolean; frequency?: string };
    inApp: { enabled: boolean; frequency?: string };
  }) {
    await this.configureEmailNotifications(config.email.enabled, config.email.frequency);
    await this.configureInAppNotifications(config.inApp.enabled, config.inApp.frequency);
  }

  /**
   * Save and verify success toast
   */
  async saveAndVerifySuccess() {
    await this.savePreferences();

    // Verify success toast appears
    const toast = this.page.locator('.sonner-toast', { hasText: 'Preferencje powiadomień zostały zaktualizowane' });
    await expect(toast).toBeVisible({ timeout: 5000 });
  }

  /**
   * Verify notification preferences form is loaded
   */
  async verifyFormLoaded() {
    await expect(this.container).toBeVisible();
    await expect(this.form).toBeVisible();
    await expect(this.emailCheckbox).toBeVisible();
    await expect(this.inAppCheckbox).toBeVisible();
  }

  /**
   * Verify email notifications settings
   */
  async verifyEmailSettings(enabled: boolean, frequency?: string) {
    const isChecked = await this.isEmailNotificationsEnabled();
    expect(isChecked).toBe(enabled);

    if (frequency) {
      const currentFrequency = await this.getEmailFrequency();
      expect(currentFrequency).toBe(frequency);
    }

    // Verify frequency select is disabled when checkbox is unchecked
    if (!enabled) {
      const isDisabled = await this.isEmailFrequencyDisabled();
      expect(isDisabled).toBe(true);
    }
  }

  /**
   * Verify in-app notifications settings
   */
  async verifyInAppSettings(enabled: boolean, frequency?: string) {
    const isChecked = await this.isInAppNotificationsEnabled();
    expect(isChecked).toBe(enabled);

    if (frequency) {
      const currentFrequency = await this.getInAppFrequency();
      expect(currentFrequency).toBe(frequency);
    }

    // Verify frequency select is disabled when checkbox is unchecked
    if (!enabled) {
      const isDisabled = await this.isInAppFrequencyDisabled();
      expect(isDisabled).toBe(true);
    }
  }

  /**
   * Verify all notification preferences
   */
  async verifyAllSettings(config: {
    email: { enabled: boolean; frequency?: string };
    inApp: { enabled: boolean; frequency?: string };
  }) {
    await this.verifyEmailSettings(config.email.enabled, config.email.frequency);
    await this.verifyInAppSettings(config.inApp.enabled, config.inApp.frequency);
  }

  /**
   * Verify save button is enabled/disabled based on form state
   */
  async verifySaveButtonState(shouldBeEnabled: boolean) {
    const isDisabled = await this.isSaveButtonDisabled();
    expect(isDisabled).toBe(!shouldBeEnabled);
  }

  /**
   * Test scenario: Disable all notifications
   */
  async disableAllNotifications() {
    await this.disableEmailNotifications();
    await this.disableInAppNotifications();
    await this.saveAndVerifySuccess();
  }

  /**
   * Test scenario: Enable only critical notifications
   */
  async enableOnlyCriticalNotifications() {
    await this.configureEmailNotifications(true, 'ONLY_CRITICAL');
    await this.configureInAppNotifications(true, 'ONLY_CRITICAL');
    await this.saveAndVerifySuccess();
  }

  /**
   * Test scenario: Enable immediate notifications
   */
  async enableImmediateNotifications() {
    await this.configureEmailNotifications(true, 'IMMEDIATE');
    await this.configureInAppNotifications(true, 'IMMEDIATE');
    await this.saveAndVerifySuccess();
  }

  /**
   * Test scenario: Enable daily digest
   */
  async enableDailyDigest() {
    await this.configureEmailNotifications(true, 'DAILY');
    await this.configureInAppNotifications(true, 'DAILY');
    await this.saveAndVerifySuccess();
  }

  /**
   * Test scenario: Mixed settings (email only critical, in-app immediate)
   */
  async configureMixedSettings() {
    await this.configureEmailNotifications(true, 'ONLY_CRITICAL');
    await this.configureInAppNotifications(true, 'IMMEDIATE');
    await this.saveAndVerifySuccess();
  }
}
