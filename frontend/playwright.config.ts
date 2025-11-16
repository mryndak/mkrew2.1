import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load test environment variables from .env.test
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

/**
 * Playwright configuration for mkrew E2E tests
 *
 * IMPORTANT: Tests use LOCAL backend (http://localhost:8080) with DISABLED rate limiting
 * Configuration loaded from: .env.test
 *
 * Backend must be started before running tests:
 * - Run: docker-compose -f docker-compose.test.yml up
 * - Or use: npm run test:e2e:backend:start
 *
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Test timeout
  timeout: 30_000,

  // Expect timeout
  expect: {
    timeout: 5_000,
  },

  // Parallel execution
  fullyParallel: true,

  // Workers - 3 in CI, max available locally
  workers: process.env.CI ? 3 : undefined,

  // Retry failed tests
  retries: process.env.CI ? 2 : 0,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
    ...(process.env.CI ? [['github' as const]] : []),
  ],

  // Output directory for artifacts
  outputDir: 'test-results/',

  // Shared settings for all tests
  use: {
    // Base URL for navigation
    baseURL: process.env.BASE_URL || 'http://localhost:4321',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on first retry
    video: 'retain-on-failure',

    // Locale and timezone
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw',

    // Viewport size
    viewport: { width: 1280, height: 720 },

    // Action timeout
    actionTimeout: 10_000,

    // Navigation timeout
    navigationTimeout: 15_000,
  },

  // Projects - Only Chromium as per CLAUDE.md guidelines
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Enable downloads
        acceptDownloads: true,
      },
    },

    // Uncomment for cross-browser testing in the future
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // Mobile viewports
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
  ],

  // Web server configuration - auto-start application before tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
