import { test, expect } from '@playwright/test';
import { HomePage } from '../page-objects/HomePage';

test.describe('Homepage E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage before each test
    const homePage = new HomePage(page);
    await homePage.goto();
  });

  test('should display homepage with main heading', async ({ page }) => {
    const homePage = new HomePage(page);

    // Verify page loaded
    await expect(page).toHaveURL('/');

    // Verify heading is visible
    await expect(homePage.heading).toBeVisible();
  });

  test('should navigate to RCKiK list page', async ({ page }) => {
    const homePage = new HomePage(page);

    // Click on RCKiK list link
    await homePage.navigateToRCKiKList();

    // Verify navigation
    await expect(page).toHaveURL(/\/rckik/);
  });

  test('should navigate to login page', async ({ page }) => {
    const homePage = new HomePage(page);

    // Click on login link
    await homePage.navigateToLogin();

    // Verify navigation
    await expect(page).toHaveURL(/\/login/);
  });

  test('should navigate to registration page', async ({ page }) => {
    const homePage = new HomePage(page);

    // Click on register link
    await homePage.navigateToRegister();

    // Verify navigation
    await expect(page).toHaveURL(/\/register/);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const homePage = new HomePage(page);
    await homePage.goto();

    // Verify page is still accessible
    await expect(homePage.heading).toBeVisible();
  });
});
