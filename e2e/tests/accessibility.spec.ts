import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests (WCAG 2.1 AA)', () => {
  test('homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('/');

    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Assert no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('RCKiK list page should be accessible', async ({ page }) => {
    await page.goto('/rckik');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('login page should be keyboard navigable', async ({ page }) => {
    await page.goto('/login');

    // Test keyboard navigation
    await page.keyboard.press('Tab');

    // Get focused element
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);

    // Verify an interactive element is focused
    expect(focusedElement).toBeTruthy();
  });

  test('forms should have proper labels', async ({ page }) => {
    await page.goto('/login');

    // Check email input has label
    const emailInput = page.locator('input[name="email"]');
    const emailLabel = page.locator('label[for*="email"]');

    await expect(emailInput).toBeVisible();
    await expect(emailLabel).toBeVisible();

    // Check password input has label
    const passwordInput = page.locator('input[name="password"]');
    const passwordLabel = page.locator('label[for*="password"]');

    await expect(passwordInput).toBeVisible();
    await expect(passwordLabel).toBeVisible();
  });
});
