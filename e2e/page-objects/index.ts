/**
 * Page Objects - Main Index
 *
 * Eksportuje wszystkie Page Objects używane w testach e2e Playwright.
 *
 * Struktura:
 * - BasePage - bazowa klasa z wspólnymi metodami
 * - HomePage - strona główna
 * - Admin - wszystkie Page Objects panelu administracyjnego
 */

export { BasePage } from './BasePage';
export { HomePage } from './HomePage';

// Admin panel page objects
export * from './admin';
