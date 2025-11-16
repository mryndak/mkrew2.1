/**
 * Page Objects for E2E Testing
 *
 * This module exports all Page Object classes for the application.
 * Based on Playwright best practices and Page Object Model pattern.
 *
 * Organized by functionality:
 * - Base: Common functionality
 * - Public: Landing pages, RCKiK List, RCKiK Details
 * - Authentication: Login, Register, Password Reset, Verification
 * - Dashboard: Notifications, Preferences
 * - Admin: Panel administracyjny (RCKiK Management, Scraper, Reports)
 */

// Base
export { BasePage } from './BasePage';

// Public pages
export { HomePage } from './HomePage';
export { RckikListPage } from './RckikListPage';
export { RckikDetailsPage } from './RckikDetailsPage';

// Authentication pages
export { LoginPage } from './LoginPage';
export { RegisterPage } from './RegisterPage';
export { ResetPasswordRequestPage } from './ResetPasswordRequestPage';
export { VerificationPage } from './VerificationPage';

// Dashboard pages
export { NotificationsPage } from './NotificationsPage';
export { NotificationPreferencesPage } from './NotificationPreferencesPage';

// Admin panel page objects
export * from './admin';
