# mkrew Frontend - Astro + React Application

> Modern web frontend dla platformy mkrew - blood donation platform

[![Astro](https://img.shields.io/badge/Astro-4.0-purple.svg)](https://astro.build/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-cyan.svg)](https://tailwindcss.com/)

## 📋 Spis treści

- [Przegląd](#przegląd)
- [Stack technologiczny](#stack-technologiczny)
- [Struktura projektu](#struktura-projektu)
- [Szybki start](#szybki-start)
- [Architektura](#architektura)
- [Komponenty](#komponenty)
- [Zarządzanie stanem](#zarządzanie-stanem)
- [Routing](#routing)
- [Testy](#testy)
- [Deployment](#deployment)

## 🎯 Przegląd

Frontend aplikacji mkrew zbudowany z wykorzystaniem **Astro** jako głównego frameworka z **React Islands** dla interaktywnych komponentów. Aplikacja wykorzystuje:

- **SSG (Static Site Generation)** dla publicznych stron
- **ISR (Incremental Static Regeneration)** z revalidation 5 min dla danych RCKiK
- **SSR (Server-Side Rendering)** dla stron autentykacji i chronionych dashboardów
- **Partial Hydration** (Astro Islands) dla optymalnej wydajności

### Kluczowe założenia UX

- **Mobile-first** responsive design
- **WCAG 2.1 AA** accessibility compliance
- **Performance**: Lighthouse score >90
- **Progressive Enhancement**: działanie bez JavaScript dla publicznych stron

## 🛠 Stack technologiczny

### Core Framework
- **Astro 4.0** - meta-framework z zero-JS default
  - Astro Islands (selective hydration)
  - View Transitions API
  - Content Collections
  - Server Endpoints

### UI Library & Components
- **React 18** - komponenty interaktywne (client islands)
- **TypeScript 5.0** - type safety
- **Tailwind CSS 3.0** - utility-first CSS framework
- **CSS Modules** - dla custom styles (opcjonalnie)

### State Management
- **Redux Toolkit** - zarządzanie stanem globalnym
  - `authSlice` - autentykacja i user data
  - `rckikSlice` - cache publicznych danych RCKiK
  - `donationsSlice` - zarządzanie donacjami
  - `favoritesSlice` - ulubione centra
  - `notificationsSlice` - powiadomienia in-app
  - `preferencesSlice` - preferencje użytkownika

### Forms & Validation
- **React Hook Form** - zarządzanie formularzami
- **Zod** - schema validation
- **DOMPurify** - sanitization (XSS prevention)

### HTTP Client
- **Axios** - HTTP client z interceptorami
  - Automatic JWT token injection
  - Global error handling (401, 403, 429, 500)
  - Retry logic dla network errors

### Charts & Visualization
- **Recharts** lub **Chart.js** - wykresy trendów krwi
- **Leaflet** lub **Mapbox GL** - mapy interaktywne (future)

### Testing
- **Vitest** - unit testing
- **React Testing Library** - component testing
- **MSW (Mock Service Worker)** - API mocking
- **Playwright** - E2E testing

### Build Tools
- **Vite** - bundler (wbudowany w Astro)
- **ESLint** - linting
- **Prettier** - code formatting

## 📁 Struktura projektu

```
frontend/
├── public/                       # Statyczne pliki (favicon, fonts, images)
│   ├── images/
│   ├── fonts/
│   └── favicon.ico
│
├── src/
│   ├── components/               # Komponenty React i Astro
│   │   ├── ui/                   # Primitive UI components (atoms)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── ...
│   │   │
│   │   ├── rckik/                # RCKiK domain components (molecules/organisms)
│   │   │   ├── RckikCard.tsx
│   │   │   ├── RckikList.tsx
│   │   │   ├── BloodLevelBadge.tsx
│   │   │   ├── BloodLevelChart.tsx   # client:visible
│   │   │   ├── MapComponent.tsx      # client:visible
│   │   │   └── ...
│   │   │
│   │   ├── auth/                 # Authentication components
│   │   │   ├── LoginForm.tsx         # client:load
│   │   │   ├── RegisterForm.tsx      # multi-step
│   │   │   ├── PasswordStrength.tsx
│   │   │   └── ...
│   │   │
│   │   ├── dashboard/            # Dashboard components (protected)
│   │   │   ├── StatsCard.tsx
│   │   │   ├── DonationTable.tsx
│   │   │   ├── FavoritesList.tsx     # drag-and-drop
│   │   │   ├── NotificationBell.tsx  # client:idle
│   │   │   └── ...
│   │   │
│   │   ├── admin/                # Admin panel components
│   │   │   ├── AdminTable.tsx
│   │   │   ├── ScraperStatus.tsx
│   │   │   └── ...
│   │   │
│   │   └── common/               # Shared components
│   │       ├── Navbar.astro
│   │       ├── Footer.astro
│   │       ├── Sidebar.astro
│   │       └── ...
│   │
│   ├── layouts/                  # Astro layouts
│   │   ├── BaseLayout.astro      # Public pages
│   │   ├── AuthLayout.astro      # Auth pages
│   │   ├── DashboardLayout.astro # Protected dashboard
│   │   └── AdminLayout.astro     # Admin panel
│   │
│   ├── pages/                    # File-based routing
│   │   ├── index.astro           # Landing page (SSG)
│   │   ├── rckik/
│   │   │   ├── index.astro       # Lista RCKiK (SSG + ISR 5min)
│   │   │   └── [id].astro        # Szczegóły (SSG + ISR 5min)
│   │   ├── login.astro           # Login (SSR)
│   │   ├── register.astro        # Register (SSR multi-step)
│   │   ├── verify-email.astro    # Verify (SSR)
│   │   ├── dashboard/
│   │   │   ├── index.astro       # Dashboard główny (SSR + auth)
│   │   │   ├── profile.astro
│   │   │   ├── donations.astro
│   │   │   ├── favorites.astro
│   │   │   └── notifications.astro
│   │   └── admin/
│   │       ├── rckik.astro
│   │       ├── scraper.astro
│   │       └── reports.astro
│   │
│   ├── lib/                      # Libraries & utilities
│   │   ├── api/                  # API client (Axios)
│   │   │   ├── client.ts         # Axios instance + interceptors
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── rckik.ts
│   │   │   │   ├── donations.ts
│   │   │   │   └── ...
│   │   │   └── types.ts
│   │   │
│   │   ├── store/                # Redux Toolkit store
│   │   │   ├── index.ts
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.ts
│   │   │   │   ├── userSlice.ts
│   │   │   │   ├── rckikSlice.ts
│   │   │   │   ├── donationsSlice.ts
│   │   │   │   ├── favoritesSlice.ts
│   │   │   │   └── notificationsSlice.ts
│   │   │   └── middleware/
│   │   │
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useApi.ts
│   │   │   ├── useDebounce.ts
│   │   │   └── ...
│   │   │
│   │   ├── utils/                # Utility functions
│   │   │   ├── validation.ts     # Zod schemas
│   │   │   ├── formatting.ts     # Date/number formatters
│   │   │   ├── bloodLevels.ts    # Blood level calculations
│   │   │   ├── auth.ts           # Auth helpers
│   │   │   └── ...
│   │   │
│   │   └── types/                # TypeScript types
│   │       ├── api.ts
│   │       ├── models.ts
│   │       └── forms.ts
│   │
│   ├── middleware/               # Astro middleware
│   │   └── auth.ts               # Auth middleware (SSR)
│   │
│   ├── assets/                   # Assets procesowane przez Vite
│   │   ├── styles/
│   │   │   ├── global.css
│   │   │   ├── variables.css
│   │   │   └── utilities.css
│   │   └── images/
│   │
│   ├── env.d.ts                  # Environment types
│   └── config.ts                 # App configuration
│
├── tests/                        # Tests
│   ├── unit/                     # Unit tests (Vitest)
│   ├── integration/              # Integration tests (RTL + MSW)
│   └── e2e/                      # E2E tests (Playwright)
│
├── astro.config.mjs              # Astro config
├── tailwind.config.cjs           # Tailwind config
├── tsconfig.json                 # TypeScript config
├── vitest.config.ts              # Vitest config
├── playwright.config.ts          # Playwright config
├── package.json
├── .env.example
└── README.md                     # This file
```

## 🚀 Szybki start

### Wymagania wstępne

- **Node.js 20+**
- **npm** lub **pnpm** (zalecane)
- Backend uruchomiony na http://localhost:8080

### 1. Instalacja zależności

```bash
npm install
# lub
pnpm install
```

### 2. Konfiguracja zmiennych środowiskowych

Skopiuj `.env.example` do `.env`:

```bash
cp .env.example .env
```

Edytuj `.env`:

```env
# Backend API URL
PUBLIC_API_URL=http://localhost:8080/api/v1

# Environment
PUBLIC_ENV=development

# Optional: Analytics, etc.
```

### 3. Uruchomienie dev server

```bash
npm run dev
```

Aplikacja będzie dostępna na: http://localhost:4321

### 4. Build dla produkcji

```bash
npm run build
```

Statyczne pliki zostaną wygenerowane w `dist/`

### 5. Preview production build

```bash
npm run preview
```

## 🏗️ Architektura

### Astro Islands Architecture

Astro Islands umożliwia **selective hydration** - tylko interaktywne komponenty są hydratowane po stronie klienta:

```tsx
// client:load - Natychmiastowa hydratacja (krytyczne komponenty)
<LoginForm client:load />

// client:idle - Hydratacja gdy przeglądarka jest bezczynna
<NotificationsWidget client:idle />

// client:visible - Hydratacja gdy komponent wchodzi w viewport
<BloodLevelChart client:visible />

// client:media - Warunkowa hydratacja (responsywność)
<MobileNav client:media="(max-width: 768px)" />
```

### Rendering Strategy

| Strona | Strategy | Revalidation | Auth |
|--------|----------|--------------|------|
| `/` (Landing) | SSG | - | Public |
| `/rckik` (Lista) | SSG + ISR | 5 min | Public |
| `/rckik/[id]` | SSG + ISR | 5 min | Public |
| `/login`, `/register` | SSR | - | Public |
| `/dashboard/*` | SSR | - | Protected |
| `/admin/*` | SSR | - | Admin only |

### Authentication Flow

1. User submits login form → `POST /api/v1/auth/login`
2. Backend returns JWT access token (+ refresh token)
3. Token stored:
   - **Preferred**: httpOnly cookie (set by backend)
   - **Fallback**: localStorage (encrypted, short TTL)
4. Axios interceptor adds `Authorization: Bearer <token>` to requests
5. Protected routes check auth in Astro middleware
6. Auto-logout on token expiry with warning modal

## 🧩 Komponenty

### UI Primitives (components/ui/)

Atomic design - podstawowe komponenty wielokrotnego użytku:

- **Button** - variants (primary, secondary, ghost), loading state, aria attributes
- **Input, Textarea, Select** - accessible labels, error messages, helper text
- **Badge** - semantic colors with icon fallback (accessibility)
- **Modal / SlideOver** - focus trap, aria-modal, ESC to close
- **Toast** - short messages (success/error/info), aria-live
- **Skeleton** - loading placeholders

### Domain Components (components/rckik/)

Komponenty specyficzne dla domeny RCKiK:

- **RckikCard** - karta centrum z badge'ami poziomów krwi
- **RckikList** - virtualized list (>50 items)
- **BloodLevelBadge** - color + icon + percent (accessibility: nie tylko kolor)
- **BloodLevelChart** - wykres trendów (Recharts, lazy-load client:visible)
- **MapComponent** - mapa z markerami (Leaflet, client:visible)

### Auth Components (components/auth/)

- **LoginForm** - email + password, rate limiting UI
- **RegisterForm** - multi-step (3 kroki), progress bar, session storage draft
- **PasswordStrength** - wizualna walidacja siły hasła
- **EmailUniquenessCheck** - debounced check przy rejestracji

### Dashboard Components (components/dashboard/)

- **StatsCard** - karty statystyk (donacje, ml, streak)
- **DonationTable** - sortable, filterable, pagination
- **DonationForm** - modal form (add/edit), Zod validation
- **FavoritesList** - drag-and-drop reordering (optimistic updates)
- **NotificationBell** - icon + badge, dropdown (client:idle)

## 🗄️ Zarządzanie stanem

### Redux Toolkit Store

```typescript
// src/lib/store/index.ts
import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    auth: authReducer,        // user, isAuthenticated, tokens
    user: userReducer,         // profile data
    rckik: rckikReducer,       // cached RCKiK data
    donations: donationsReducer,
    favorites: favoritesReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authMiddleware, errorMiddleware),
});
```

### Slices

#### authSlice
- `user: User | null`
- `isAuthenticated: boolean`
- `accessToken: string | null`
- `refreshToken: string | null`
- Actions: `login()`, `logout()`, `refreshToken()`, `setUser()`

#### rckikSlice
- `list: Rckik[]` - cached lista RCKiK
- `current: RckikDetail | null` - aktualnie wyświetlany RCKiK
- `filters: FilterState` - aktywne filtry
- Actions: `fetchRckikList()`, `setFilters()`, `clearCache()`

#### donationsSlice
- `donations: Donation[]`
- `statistics: DonationStats`
- Actions: `fetchDonations()`, `addDonation()`, `updateDonation()`, `deleteDonation()`

### Persystencja

- **Preferred**: httpOnly cookies (backend sets, frontend reads via API)
- **Fallback**: localStorage z `redux-persist` (encrypted, short TTL)

## 🛣️ Routing

### File-based Routing (Astro)

```
pages/
├── index.astro              → /
├── rckik/
│   ├── index.astro          → /rckik
│   └── [id].astro           → /rckik/123
├── login.astro              → /login
├── register.astro           → /register
├── dashboard/
│   ├── index.astro          → /dashboard
│   ├── profile.astro        → /dashboard/profile
│   └── donations.astro      → /dashboard/donations
└── admin/
    └── rckik.astro          → /admin/rckik
```

### Protected Routes

Middleware `src/middleware/auth.ts` sprawdza autentykację dla:
- `/dashboard/*` - wymaga `isAuthenticated`
- `/admin/*` - wymaga `role === 'ADMIN'`

Redirect do `/login` jeśli brak autentykacji.

## 🧪 Testy

### Unit Tests (Vitest)

```bash
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

Przykład:
```typescript
// tests/unit/utils/bloodLevels.test.ts
import { describe, it, expect } from 'vitest';
import { getBloodLevelStatus } from '@/lib/utils/bloodLevels';

describe('getBloodLevelStatus', () => {
  it('returns CRITICAL for levels < 20%', () => {
    expect(getBloodLevelStatus(15)).toBe('CRITICAL');
  });

  it('returns IMPORTANT for levels < 50%', () => {
    expect(getBloodLevelStatus(35)).toBe('IMPORTANT');
  });

  it('returns OK for levels >= 50%', () => {
    expect(getBloodLevelStatus(75)).toBe('OK');
  });
});
```

### Integration Tests (React Testing Library + MSW)

```bash
npm run test:integration
```

Przykład:
```typescript
// tests/integration/auth.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import LoginForm from '@/components/auth/LoginForm';

const server = setupServer(
  http.post('/api/v1/auth/login', () => {
    return HttpResponse.json({ accessToken: 'fake-token' });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('should login successfully', async () => {
  render(<LoginForm />);

  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'test@example.com' }
  });
  fireEvent.change(screen.getByLabelText('Hasło'), {
    target: { value: 'SecurePass123!' }
  });

  fireEvent.click(screen.getByRole('button', { name: 'Zaloguj' }));

  expect(await screen.findByText('Logowanie udane')).toBeInTheDocument();
});
```

### E2E Tests (Playwright)

```bash
npm run test:e2e
npm run test:e2e:ui    # UI mode
```

Przykład:
```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can register and verify email', async ({ page }) => {
  // 1. Navigate to register page
  await page.goto('/register');

  // 2. Fill multi-step form
  await page.fill('[name="email"]', 'newuser@example.com');
  await page.fill('[name="password"]', 'SecurePass123!');
  await page.check('[name="consent"]');
  await page.click('button:has-text("Dalej")');

  // Step 2
  await page.fill('[name="firstName"]', 'Jan');
  await page.fill('[name="lastName"]', 'Kowalski');
  await page.click('button:has-text("Zarejestruj")');

  // 3. Verify success message
  await expect(page.locator('text=Sprawdź email')).toBeVisible();
});
```

## 🚀 Deployment

### Build dla produkcji

```bash
npm run build
```

Generuje statyczne pliki w `dist/`:
- HTML, CSS, JS (minified)
- Obrazy (optimized)
- Fonts
- `_astro/` - chunked JS/CSS

### Preview production build

```bash
npm run preview
```

### Deploy na GCP (Google Cloud Platform)

#### Option A: Cloud Storage + CDN (Static)

```bash
# Build
npm run build

# Upload do Cloud Storage bucket
gsutil -m rsync -r -d ./dist gs://mkrew-frontend

# Set bucket as public website
gsutil web set -m index.html -e 404.html gs://mkrew-frontend
```

#### Option B: GKE (Kubernetes)

1. Create Dockerfile:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. Build & push:
```bash
docker build -t gcr.io/PROJECT_ID/mkrew-frontend:latest .
docker push gcr.io/PROJECT_ID/mkrew-frontend:latest
```

3. Deploy to GKE:
```bash
kubectl apply -f k8s/frontend-deployment.yml
kubectl apply -f k8s/frontend-service.yml
```

### Environment Variables (Production)

```env
PUBLIC_API_URL=https://api.mkrew.pl/api/v1
PUBLIC_ENV=production
PUBLIC_GTM_ID=GTM-XXXXXX
```

## 📊 Performance Optimization

### Achieved Metrics (Target)
- **Lighthouse Performance**: >90
- **Lighthouse Accessibility**: >95
- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <3.0s
- **Bundle size**: <500KB (initial)

### Optimization Techniques
- ✅ Astro Islands (zero-JS dla statycznych części)
- ✅ Lazy loading (client:visible dla wykresów/map)
- ✅ Code splitting per route
- ✅ ISR z 5-min revalidation dla danych RCKiK
- ✅ Virtualized lists (>50 items)
- ✅ Debounce dla search/filters
- ✅ Image optimization (WebP, lazy loading)
- ⏳ Service Worker (PWA - future)

## 🔐 Bezpieczeństwo

### Implemented
- ✅ **XSS Prevention**: DOMPurify sanitization, escaped output
- ✅ **CSRF Protection**: httpOnly cookies + SameSite, CORS configured
- ✅ **Auth**: JWT tokens, auto-logout on expiry
- ✅ **Input Validation**: Zod schemas, server-side validation
- ✅ **Rate Limiting**: UI feedback dla 429 errors
- ✅ **HTTPS**: enforced w production
- ✅ **CSP Headers**: Content Security Policy (Astro config)
- ✅ **No PII in console**: production logs filtered

## 📚 Dodatkowe zasoby

- [Astro Docs](https://docs.astro.build/)
- [React Docs](https://react.dev/)
- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Playwright Docs](https://playwright.dev/)
- [UI Plan (detailed)](./../.ai/ui-plan.md)

## 🤝 Contributing

Projekt w fazie MVP - contributing guidelines będą opublikowane po publicznym release.

## 📄 License

Proprietary - mkrew Project

---

**Built with ⚡️ Astro + ⚛️ React**
