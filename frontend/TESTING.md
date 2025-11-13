# Testing Guide - RCKiK Details View

## Overview

This document describes the testing strategy for the RCKiK Details View implementation, including setup instructions, test examples, and best practices.

## Test Framework

**Recommended stack:**
- **Vitest** - Fast unit test framework for Vite/Astro projects
- **@testing-library/react** - React component testing utilities
- **@testing-library/user-event** - User interaction simulation
- **@testing-library/jest-dom** - Custom matchers for DOM assertions

## Installation

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event happy-dom
```

## Configuration

### 1. Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.{ts,js}',
        '**/*.d.ts',
        '**/__tests__/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 2. Create `vitest.setup.ts`:

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia (for responsive tests)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});
```

### 3. Update `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run"
  }
}
```

## Test Structure

### Component Tests

Located in: `src/components/**/__tests__/*.test.tsx`

**Example: RckikHeader.test.tsx** ✅ Already created

Tests cover:
- ✅ Rendering (name, code, address, badges)
- ✅ Map link generation
- ✅ Favorite button states (authenticated/unauthenticated)
- ✅ User interactions (click, keyboard navigation)
- ✅ Accessibility (ARIA labels, heading hierarchy)
- ✅ Edge cases (long names, missing data)

### Hook Tests

Located in: `src/lib/hooks/__tests__/*.test.ts`

**Example: useBloodLevelHistory.test.ts** ✅ Already created

Tests cover:
- ✅ Initial state
- ✅ Successful data fetching
- ✅ Error handling (404, 403, 500, network errors)
- ✅ Refetch functionality
- ✅ Parameter changes
- ✅ Edge cases (null ID, empty responses)

### Integration Tests

Located in: `src/pages/__tests__/*.test.tsx`

**Example: RckikDetailsPage.integration.test.tsx** (to be created)

Would test:
- Full page rendering with all components
- Data flow from API to components
- User workflows (filtering, sorting, pagination)
- Error scenarios (404, network failures)

## Test Examples

### 1. Testing Component Rendering

```typescript
import { render, screen } from '@testing-library/react';
import { BloodLevelBadge } from '@/components/rckik/BloodLevelBadge';

it('should render blood level badge with correct data', () => {
  const mockLevel = {
    bloodGroup: 'A+',
    levelPercentage: 45.5,
    levelStatus: 'IMPORTANT',
    lastUpdate: '2025-01-15T10:00:00',
  };

  render(<BloodLevelBadge bloodLevel={mockLevel} size="large" />);

  expect(screen.getByText('A+')).toBeInTheDocument();
  expect(screen.getByText('45.5%')).toBeInTheDocument();
});
```

### 2. Testing User Interactions

```typescript
import userEvent from '@testing-library/user-event';

it('should call onClick when badge is clicked', async () => {
  const user = userEvent.setup();
  const onClick = vi.fn();

  render(<BloodLevelBadge bloodLevel={mockLevel} onClick={onClick} />);

  await user.click(screen.getByText('A+'));

  expect(onClick).toHaveBeenCalledWith('A+');
});
```

### 3. Testing Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';

it('should fetch data successfully', async () => {
  vi.spyOn(api, 'fetchRckikDetails').mockResolvedValue(mockData);

  const { result } = renderHook(() => useRckikDetails(1));

  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.rckik).toEqual(mockData);
});
```

### 4. Testing Error Handling

```typescript
it('should display error message on API failure', async () => {
  vi.spyOn(api, 'fetchRckikDetails').mockRejectedValue(new Error('API Error'));

  const { result } = renderHook(() => useRckikDetails(1));

  await waitFor(() => expect(result.current.error).toBeTruthy());

  expect(result.current.error?.message).toContain('Nie udało się');
});
```

## Test Coverage Goals

### Components
- [ ] `RckikHeader` - ✅ Tests created
- [ ] `BloodLevelBadge` - 🔄 To be created
- [ ] `BloodGroupSelector` - 🔄 To be created
- [ ] `BloodLevelChart` - 🔄 To be created
- [ ] `HistoryTable` - 🔄 To be created
- [ ] `ScraperStatus` - 🔄 To be created
- [ ] `FavoriteButton` - 🔄 To be created

### Hooks
- [ ] `useRckikDetails` - 🔄 To be created
- [ ] `useBloodLevelHistory` - ✅ Tests created
- [ ] `useFavoriteToggle` - 🔄 To be created

### Redux Slices
- [ ] `rckikSlice` - 🔄 To be created
- [ ] `favoritesSlice` - 🔄 To be created

### Target Coverage
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Running Tests

```bash
# Run all tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run

# Run with coverage report
npm run test:coverage

# Run with UI (Vitest UI)
npm run test:ui

# Run specific test file
npm test RckikHeader.test.tsx

# Run tests matching pattern
npm test -- --grep="Favorite button"
```

## Best Practices

### 1. **Test Naming**
```typescript
describe('ComponentName', () => {
  describe('Feature/Section', () => {
    it('should do something specific', () => {
      // test
    });
  });
});
```

### 2. **AAA Pattern**
```typescript
it('should update favorite status', async () => {
  // Arrange
  const mockData = { id: 1, name: 'Test' };

  // Act
  render(<Component data={mockData} />);
  await user.click(screen.getByText('Add'));

  // Assert
  expect(screen.getByText('Added')).toBeInTheDocument();
});
```

### 3. **Mock External Dependencies**
```typescript
vi.mock('@/lib/api/endpoints/rckik', () => ({
  fetchRckikDetails: vi.fn(),
  fetchBloodLevelHistory: vi.fn(),
}));
```

### 4. **Clean Up**
```typescript
afterEach(() => {
  vi.clearAllMocks();
  cleanup();
});
```

### 5. **Test Accessibility**
```typescript
// Use accessible queries
screen.getByRole('button', { name: /dodaj do ulubionych/i });
screen.getByLabelText('Grupa krwi');
screen.getByRole('heading', { level: 1 });
```

### 6. **Async Testing**
```typescript
// Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// Or findBy queries (built-in async)
const element = await screen.findByText('Loaded');
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## Debugging Tests

### VS Code Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Vitest Tests",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "test"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Debug in Browser

```bash
npm run test:ui
```

Opens Vitest UI in browser with visual test runner and debugger.

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Kent C. Dodds - Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## TODO

- [ ] Set up Vitest configuration
- [ ] Install testing dependencies
- [ ] Create remaining component tests
- [ ] Create hook tests
- [ ] Create Redux slice tests
- [ ] Set up CI/CD pipeline
- [ ] Achieve 80%+ coverage
- [ ] Add E2E tests with Playwright (optional)
