# Plan implementacji widoku Landing Page

## 1. Przegląd

Landing Page to główna strona powitalna aplikacji mkrew, służąca jako punkt wejścia dla nowych użytkowników. Jej głównym celem jest wprowadzenie do usługi, przedstawienie value proposition aplikacji, zaprezentowanie kluczowych funkcjonalności oraz zachęcenie użytkowników do rejestracji lub logowania. Strona jest w pełni statyczna, zoptymalizowana pod kątem SEO, dostępności i responsywności.

## 2. Routing widoku

- **Ścieżka**: `/`
- **Plik**: `src/pages/index.astro`
- **Typ renderowania**: Static Site Generation (SSG)
- **Dostępność**: Publiczna (nie wymaga uwierzytelnienia)

## 3. Struktura komponentów

```
LandingPage (src/pages/index.astro)
├── Head/SEO (meta tags, title, description)
├── Header (opcjonalnie - logo + przyciski nawigacyjne)
├── Hero
│   ├── Heading (H1)
│   ├── Subtitle i opis
│   └── CTA Buttons Container
│       ├── Button (primary - "Zarejestruj się")
│       └── Button (secondary - "Zaloguj się")
├── HowItWorks
│   ├── Section Heading (H2)
│   └── Steps Container
│       ├── StepCard × 4
├── FeaturesList
│   ├── Section Heading (H2)
│   └── Features Grid
│       ├── FeatureCard × 4
├── Testimonials (opcjonalny)
│   ├── Section Heading (H2)
│   └── Testimonials Container
│       ├── TestimonialCard × 2-3
├── CTASection
│   ├── Heading (H2)
│   ├── Description
│   └── Button (primary - "Rozpocznij teraz")
└── Footer
    ├── Footer Sections Container
    │   ├── FooterSection (O projekcie)
    │   ├── FooterSection (Prawne)
    │   └── FooterSection (Linki)
    └── Copyright
```

## 4. Szczegóły komponentów

### Hero

- **Opis komponentu**: Główna sekcja powitalna widoczna jako pierwsza po załadowaniu strony. Zawiera główny nagłówek (H1) z value proposition, podtytuł wyjaśniający czym jest aplikacja, krótki opis korzyści oraz dwa przyciski CTA prowadzące do rejestracji i logowania.

- **Główne elementy**:
  - `<section>` z odpowiednim background (gradient, kolor lub obraz)
  - `<div>` container dla zawartości z max-width
  - `<h1>` - główny nagłówek (np. "Bądź na bieżąco ze stanami krwi w Polsce")
  - `<p>` - podtytuł/subtitle (np. "mkrew pomaga dawcom krwi monitorować stany zapasów i otrzymywać powiadomienia")
  - `<div>` - container na przyciski CTA
  - 2× `<Button>` komponenty

- **Obsługiwane interakcje**:
  - Click na przycisk "Zarejestruj się" → nawigacja do `/register`
  - Click na przycisk "Zaloguj się" → nawigacja do `/login`

- **Obsługiwana walidacja**: Brak (sekcja informacyjna)

- **Typy**: Brak specyficznych typów (używa ButtonProps dla przycisków)

- **Propsy**: Brak (dane hardcoded lub importowane)

### HowItWorks

- **Opis komponentu**: Sekcja wyjaśniająca jak działa platforma w 4 prostych krokach. Każdy krok jest reprezentowany przez kartę zawierającą numer, tytuł, opis i opcjonalną ikonę.

- **Główne elementy**:
  - `<section id="how-it-works">` dla możliwości scroll navigation
  - `<h2>` - nagłówek sekcji (np. "Jak to działa?")
  - `<div>` - grid/flex container na karty kroków
  - 4× `<StepCard>` komponenty

- **Obsługiwane interakcje**:
  - Brak bezpośrednich interakcji (opcjonalnie hover effects)
  - Scroll animations przy wejściu w viewport (opcjonalnie)

- **Obsługiwana walidacja**: Brak

- **Typy**: `Step[]` (array kroków do wyświetlenia)

- **Propsy**:
  ```typescript
  steps: Step[]
  ```

### StepCard

- **Opis komponentu**: Pojedyncza karta reprezentująca krok w procesie korzystania z aplikacji. Wyświetla numer kroku, ikonę (opcjonalnie), tytuł i opis.

- **Główne elementy**:
  - `<div>` - container karty z odpowiednim stylingiem
  - `<span>` lub `<div>` - numer kroku (duży, wyróżniony)
  - `<img>` lub `<svg>` - ikona (opcjonalnie)
  - `<h3>` - tytuł kroku
  - `<p>` - opis kroku

- **Obsługiwane interakcje**: Brak (statyczny komponent informacyjny)

- **Obsługiwana walidacja**: Brak

- **Typy**: `Step`

- **Propsy**:
  ```typescript
  step: Step
  ```

### FeaturesList

- **Opis komponentu**: Sekcja prezentująca główne funkcjonalności aplikacji. Zawiera nagłówek sekcji i grid/flex layout z 4 kartami funkcjonalności.

- **Główne elementy**:
  - `<section id="features">`
  - `<h2>` - nagłówek sekcji (np. "Kluczowe funkcjonalności")
  - `<p>` - opcjonalny podtytuł
  - `<div>` - grid container (2×2 lub 4×1 na mobile)
  - 4× `<FeatureCard>` komponenty

- **Obsługiwane interakcje**:
  - Brak bezpośrednich interakcji
  - Opcjonalnie hover effects na kartach

- **Obsługiwana walidacja**: Brak

- **Typy**: `Feature[]`

- **Propsy**:
  ```typescript
  features: Feature[]
  ```

### FeatureCard

- **Opis komponentu**: Karta prezentująca pojedynczą funkcjonalność aplikacji. Zawiera ikonę, tytuł i opis funkcjonalności. Komponent wielokrotnego użytku.

- **Główne elementy**:
  - `<div>` lub `<article>` - container karty
  - `<div>` - icon container z ikoną/SVG
  - `<h3>` - tytuł funkcjonalności
  - `<p>` - opis funkcjonalności

- **Obsługiwane interakcje**:
  - Opcjonalnie hover effect (elevation, scale)

- **Obsługiwana walidacja**: Brak

- **Typy**: `Feature`

- **Propsy**:
  ```typescript
  feature: Feature
  ```

### Testimonials

- **Opis komponentu**: Opcjonalna sekcja z opiniami/referencjami użytkowników. Prezentuje 2-3 testimoniale w postaci kart z cytatem, autorem i opcjonalnym avatarem.

- **Główne elementy**:
  - `<section id="testimonials">`
  - `<h2>` - nagłówek sekcji (np. "Co mówią nasi użytkownicy")
  - `<div>` - container na testimoniale (flex/grid)
  - 2-3× `<TestimonialCard>` komponenty

- **Obsługiwane interakcje**:
  - Opcjonalnie carousel/slider z navigation (jeśli więcej niż 3 testimoniale)
  - Swipe gestures na mobile (opcjonalnie)

- **Obsługiwana walidacja**: Brak

- **Typy**: `Testimonial[]`

- **Propsy**:
  ```typescript
  testimonials: Testimonial[]
  ```

### TestimonialCard

- **Opis komponentu**: Pojedyncza karta opinii użytkownika. Zawiera cytat, autora, opcjonalną rolę/opis autora i avatar.

- **Główne elementy**:
  - `<div>` lub `<blockquote>` - container
  - `<img>` - avatar użytkownika (opcjonalnie)
  - `<p>` - treść testimonial (cytat)
  - `<cite>` lub `<div>` - autor i rola

- **Obsługiwane interakcje**: Brak

- **Obsługiwana walidacja**: Brak

- **Typy**: `Testimonial`

- **Propsy**:
  ```typescript
  testimonial: Testimonial
  ```

### CTASection

- **Opis komponentu**: Dodatkowa sekcja Call-to-Action umieszczona przed footerem. Finalny push zachęcający do rejestracji. Zawiera nagłówek, krótki opis i przycisk CTA.

- **Główne elementy**:
  - `<section>` z kontrastowym tłem (np. gradient)
  - `<div>` - centered container
  - `<h2>` - nagłówek CTA (np. "Gotowy zostać bohaterem?")
  - `<p>` - description
  - `<Button>` - primary CTA button

- **Obsługiwane interakcje**:
  - Click na przycisk → nawigacja do `/register`

- **Obsługiwana walidacja**: Brak

- **Typy**: Brak

- **Propsy**: Brak (hardcoded content)

### Footer

- **Opis komponentu**: Stopka strony zawierająca linki do różnych sekcji (O projekcie, Prawne, Linki), informację o prawach autorskich oraz link do listy RCKiK. Podzielona na kolumny/sekcje z grupami linków.

- **Główne elementy**:
  - `<footer>`
  - `<div>` - main footer container
  - `<div>` - footer sections grid/flex (3-4 kolumny)
  - 3× `<FooterSection>` komponenty (lub bezpośrednio div z linkami)
  - `<div>` - copyright section
  - `<p>` - copyright text

- **Obsługiwane interakcje**:
  - Click na linki → nawigacja do odpowiednich stron
  - Rozróżnienie linków wewnętrznych i zewnętrznych (external links otwierają się w nowej karcie)

- **Obsługiwana walidacja**: Brak

- **Typy**: `FooterSection[]`

- **Propsy**:
  ```typescript
  sections: FooterSection[]
  ```

### FooterSection

- **Opis komponentu**: Pojedyncza sekcja (kolumna) w footerze zawierająca tytuł i listę linków.

- **Główne elementy**:
  - `<div>` - section container
  - `<h3>` lub `<h4>` - tytuł sekcji
  - `<ul>` - lista linków
  - n× `<li>` z `<a>` - poszczególne linki

- **Obsługiwane interakcje**:
  - Click na link → nawigacja

- **Obsługiwana walidacja**: Brak

- **Typy**: `FooterSection`

- **Propsy**:
  ```typescript
  section: FooterSection
  ```

### Button (reusable)

- **Opis komponentu**: Uniwersalny komponent przycisku wielokrotnego użytku. Obsługuje różne warianty (primary, secondary, outline), rozmiary i może działać jako link lub button.

- **Główne elementy**:
  - `<a>` gdy href jest podany, `<button>` w przeciwnym wypadku
  - Slot dla children (tekst przycisku)

- **Obsługiwane interakcje**:
  - Click → wywołanie onClick lub nawigacja (w zależności od props)
  - Hover, focus states
  - Keyboard navigation (Enter, Space)

- **Obsługiwana walidacja**: Brak (opcjonalnie disabled state)

- **Typy**: `ButtonProps`

- **Propsy**:
  ```typescript
  interface ButtonProps {
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'small' | 'medium' | 'large';
    href?: string;
    onClick?: () => void;
    disabled?: boolean;
    ariaLabel?: string;
    class?: string;
  }
  ```

## 5. Typy

Wszystkie typy zdefiniowane w `src/types/landing.ts`:

```typescript
/**
 * Reprezentuje pojedynczą funkcjonalność aplikacji
 */
export interface Feature {
  id: string;
  title: string;
  description: string;
  icon?: string; // nazwa ikony lub ścieżka do SVG/obrazu
}

/**
 * Reprezentuje krok w sekcji "Jak to działa"
 */
export interface Step {
  number: number;
  title: string;
  description: string;
  icon?: string;
}

/**
 * Reprezentuje opinię/testimonial użytkownika
 */
export interface Testimonial {
  id: string;
  author: string;
  role?: string; // np. "Dawca krwi od 5 lat"
  content: string;
  avatar?: string; // ścieżka do obrazu avatara
}

/**
 * Reprezentuje pojedynczy link w footerze
 */
export interface FooterLink {
  label: string;
  href: string;
  external?: boolean; // czy link prowadzi poza aplikację
  ariaLabel?: string;
}

/**
 * Reprezentuje sekcję (kolumnę) w footerze
 */
export interface FooterSection {
  title: string;
  links: FooterLink[];
}

/**
 * Warianty stylistyczne przycisku
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline';

/**
 * Rozmiary przycisku
 */
export type ButtonSize = 'small' | 'medium' | 'large';

/**
 * Props komponentu Button
 */
export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  class?: string;
}
```

## 6. Zarządzanie stanem

Landing Page jest całkowicie statyczna i **nie wymaga zarządzania stanem**. Wszystkie dane są zdefiniowane statycznie i importowane z plików konfiguracyjnych.

### Dane statyczne

Dane dla Landing Page przechowywane w `src/data/landing.ts`:

```typescript
import type { Feature, Step, Testimonial, FooterSection } from '../types/landing';

export const features: Feature[] = [
  {
    id: 'feature-1',
    title: 'Aktualny stan zapasów krwi',
    description: 'Sprawdź w czasie rzeczywistym stan zapasów krwi we wszystkich RCKiK w Polsce',
    icon: 'blood-drop'
  },
  {
    id: 'feature-2',
    title: 'Dziennik donacji',
    description: 'Prowadź osobisty dziennik swoich donacji i eksportuj dane w dowolnym momencie',
    icon: 'calendar'
  },
  {
    id: 'feature-3',
    title: 'Powiadomienia',
    description: 'Otrzymuj alerty e-mail i w aplikacji, gdy Twoje ulubione RCKiK potrzebują krwi',
    icon: 'bell'
  },
  {
    id: 'feature-4',
    title: 'Historia i trendy',
    description: 'Zobacz historyczne dane i trendy zapasów krwi w poszczególnych centrach',
    icon: 'chart'
  }
];

export const steps: Step[] = [
  {
    number: 1,
    title: 'Zarejestruj się',
    description: 'Załóż darmowe konto i podaj swoją grupę krwi',
    icon: 'user-plus'
  },
  {
    number: 2,
    title: 'Wybierz RCKiK',
    description: 'Wybierz swoje ulubione centra krwiodawstwa',
    icon: 'map-pin'
  },
  {
    number: 3,
    title: 'Otrzymuj powiadomienia',
    description: 'Bądź na bieżąco z potrzebami wybranych centrów',
    icon: 'bell'
  },
  {
    number: 4,
    title: 'Oddaj krew',
    description: 'Udaj się do centrum i zapisz donację w swoim dzienniku',
    icon: 'heart'
  }
];

export const testimonials: Testimonial[] = [
  {
    id: 'testimonial-1',
    author: 'Jan Kowalski',
    role: 'Dawca krwi od 3 lat',
    content: 'Dzięki mkrew zawsze wiem, kiedy moja krew jest najbardziej potrzebna. Aplikacja jest intuicyjna i bardzo pomocna.',
    avatar: '/avatars/user1.jpg'
  },
  {
    id: 'testimonial-2',
    author: 'Anna Nowak',
    role: 'Honorowy dawca krwi',
    content: 'Wreszcie mogę łatwo śledzić historię swoich donacji i otrzymywać powiadomienia. Polecam każdemu dawcy!',
    avatar: '/avatars/user2.jpg'
  }
];

export const footerSections: FooterSection[] = [
  {
    title: 'O projekcie',
    links: [
      { label: 'O nas', href: '/o-nas', external: false },
      { label: 'Jak to działa', href: '/#how-it-works', external: false },
      { label: 'Kontakt', href: '/kontakt', external: false }
    ]
  },
  {
    title: 'Prawne',
    links: [
      { label: 'Polityka prywatności', href: '/polityka-prywatnosci', external: false },
      { label: 'Regulamin', href: '/regulamin', external: false },
      { label: 'GDPR', href: '/gdpr', external: false }
    ]
  },
  {
    title: 'Linki',
    links: [
      { label: 'Lista RCKiK', href: '/rckik', external: false },
      { label: 'Blog', href: '/blog', external: false }
    ]
  }
];
```

### Custom hooki

**Brak** - Landing Page nie wymaga custom hooków.

## 7. Integracja API

Landing Page **nie wymaga integracji z API**. Jest to w pełni statyczna strona generowana podczas build time (Static Site Generation).

### Przyszłe rozszerzenia (opcjonalnie)

W przyszłości, jeśli będzie potrzeba dynamicznej zawartości:
- Fetching aktualnych statystyk (np. liczba użytkowników) - `GET /api/stats/public`
- Fetching dynamicznych testimoniali z CMS - `GET /api/testimonials`

## 8. Interakcje użytkownika

| Interakcja | Element/Komponent | Oczekiwany wynik |
|------------|-------------------|------------------|
| Click na "Zarejestruj się" | Hero → Button (primary) | Nawigacja do `/register` |
| Click na "Zaloguj się" | Hero → Button (secondary) | Nawigacja do `/login` |
| Click na "Rozpocznij teraz" | CTASection → Button | Nawigacja do `/register` |
| Click na link "Lista RCKiK" | Footer → Link | Nawigacja do `/rckik` |
| Click na "Polityka prywatności" | Footer → Link | Nawigacja do `/polityka-prywatnosci` |
| Click na "Kontakt" | Footer → Link | Nawigacja do `/kontakt` |
| Click na "Jak to działa" (nav) | Navigation → Link | Smooth scroll do sekcji #how-it-works |
| Scroll strony | Wszystkie sekcje | Opcjonalne fade-in animations przy wejściu w viewport |
| Hover na FeatureCard | FeatureCard | Subtle elevation/scale effect (transform: scale(1.02)) |
| Hover na Button | Button | Color change, transition effect |
| Resize okna/urządzenie mobilne | Wszystkie komponenty | Responsywne dostosowanie layoutu (grid → stack) |
| Tab navigation | Wszystkie linki i przyciski | Widoczny focus indicator, logiczna kolejność |

## 9. Warunki i walidacja

Landing Page nie zawiera formularzy, więc **nie ma warunków walidacji danych użytkownika**.

### Warunki renderowania

- **FeatureCard**: Renderowany tylko gdy `features` array ma elementy
- **TestimonialCard**: Renderowany tylko gdy `testimonials` array ma elementy (sekcja opcjonalna)
- **FooterSection**: Renderowana tylko gdy `sections` array ma elementy
- **Icon/Avatar**: Renderowany tylko gdy ścieżka do ikony/avatara jest dostępna, w przeciwnym razie fallback do placeholder

### Defensive programming

```typescript
// Przykład w komponencie FeaturesList
{features && features.length > 0 ? (
  features.map(feature => <FeatureCard feature={feature} />)
) : null}

// Przykład w komponencie TestimonialCard
{testimonial.avatar ? (
  <img src={testimonial.avatar} alt={testimonial.author} />
) : (
  <div class="avatar-placeholder">{testimonial.author[0]}</div>
)}
```

## 10. Obsługa błędów

### Scenariusze błędów i obsługa

1. **Brakujące obrazy/ikony**
   - **Scenariusz**: Ścieżka do ikony/avatara jest nieprawidłowa lub plik nie istnieje
   - **Obsługa**:
     - Fallback do placeholder image
     - Alt text dla screen readers
     - Console warning w development mode
   - **Implementacja**: `<img>` z `onerror` handler lub conditional rendering

2. **Błędne linki w nawigacji**
   - **Scenariusz**: Link prowadzi do nieistniejącej strony (404)
   - **Obsługa**:
     - 404 page z opcją powrotu do home page
     - Sprawdzenie linków w testach e2e
   - **Implementacja**: Custom 404.astro page

3. **Brak danych do wyświetlenia**
   - **Scenariusz**: Arrays (features, testimonials) są puste lub undefined
   - **Obsługa**:
     - Defensive programming (sprawdzenie przed map())
     - Nie renderowanie sekcji jeśli brak danych
     - Fallback message (rzadko potrzebny dla statycznej strony)
   - **Implementacja**: Conditional rendering

4. **Problemy z ładowaniem strony**
   - **Scenariusz**: Długie ładowanie lub błąd sieci
   - **Obsługa**:
     - Static HTML ładowany natychmiast (Astro SSG)
     - Progressive enhancement
     - Skeleton/loading states dla dynamicznych części (jeśli będą)
   - **Implementacja**: Minimal JS, krityczny CSS inline

5. **Problemy z zewnętrznymi linkami**
   - **Scenariusz**: Link zewnętrzny (np. do RCKiK) jest niedostępny
   - **Obsługa**:
     - `rel="noopener noreferrer"` dla bezpieczeństwa
     - `target="_blank"` dla linków zewnętrznych
     - Tooltip/info że link prowadzi poza serwis
   - **Implementacja**: Component logic w FooterLink

### Error Boundaries (opcjonalnie dla React islands)

Jeśli używane będą React Islands dla interaktywnych komponentów:

```typescript
// ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Coś poszło nie tak.</div>;
    }
    return this.props.children;
  }
}
```

## 11. Kroki implementacji

### Faza 1: Setup i struktura podstawowa (1-2 dni)

1. **Utworzenie struktury katalogów**
   ```
   src/
   ├── components/
   │   ├── landing/
   │   │   ├── Hero.astro
   │   │   ├── HowItWorks.astro
   │   │   ├── StepCard.astro
   │   │   ├── FeaturesList.astro
   │   │   ├── FeatureCard.astro
   │   │   ├── Testimonials.astro
   │   │   ├── TestimonialCard.astro
   │   │   ├── CTASection.astro
   │   │   ├── Footer.astro
   │   │   └── FooterSection.astro
   │   ├── ui/
   │   │   └── Button.astro
   │   └── SEO.astro
   ├── data/
   │   └── landing.ts
   ├── types/
   │   └── landing.ts
   ├── styles/
   │   ├── global.css
   │   └── landing.css (opcjonalnie)
   └── pages/
       └── index.astro
   ```

2. **Zdefiniowanie typów w `src/types/landing.ts`**
   - Utworzenie wszystkich interfejsów: Feature, Step, Testimonial, FooterLink, FooterSection, ButtonProps
   - Export typów

3. **Utworzenie danych statycznych w `src/data/landing.ts`**
   - Zdefiniowanie arrays: features, steps, testimonials, footerSections
   - Import i użycie zdefiniowanych typów

4. **Setup stylowania**
   - Konfiguracja Tailwind CSS lub CSS Modules
   - Zdefiniowanie design tokens (kolory, typography, spacing)
   - Utworzenie global styles w `src/styles/global.css`

### Faza 2: Komponenty podstawowe (2-3 dni)

5. **Implementacja komponentu Button (`src/components/ui/Button.astro`)**
   - Utworzenie komponentu z props: variant, size, href, disabled, ariaLabel
   - Stylowanie wariantów (primary, secondary, outline)
   - Obsługa nawigacji (conditional rendering `<a>` vs `<button>`)
   - States: hover, focus, disabled
   - Accessibility: ARIA labels, keyboard navigation

6. **Implementacja komponentu SEO (`src/components/SEO.astro`)**
   - Meta tags: title, description, keywords
   - Open Graph tags dla social media
   - Twitter Card tags
   - Canonical URL
   - Favicon links

7. **Implementacja komponentu FeatureCard (`src/components/landing/FeatureCard.astro`)**
   - Props: feature (Feature type)
   - Layout: icon + title + description
   - Stylowanie karty (border, shadow, padding)
   - Hover effects (opcjonalnie)

8. **Implementacja komponentu StepCard (`src/components/landing/StepCard.astro`)**
   - Props: step (Step type)
   - Layout: number + icon + title + description
   - Stylowanie: wyróżnienie numeru, centrowanie
   - Responsive design

### Faza 3: Sekcje Landing Page (3-4 dni)

9. **Implementacja Hero (`src/components/landing/Hero.astro`)**
   - Layout: centrowana zawartość z max-width
   - H1 heading z głównym przekazem
   - Subtitle i description
   - Container na dwa Button komponenty (Zarejestruj/Zaloguj)
   - Background styling (gradient lub kolor)
   - Responsive: stack buttons na mobile

10. **Implementacja HowItWorks (`src/components/landing/HowItWorks.astro`)**
    - Import steps z data/landing.ts
    - Section heading (H2)
    - Grid/flex layout na StepCard komponenty
    - Map przez steps array i renderowanie StepCard
    - Responsive: 4 kolumny → 2 kolumny → 1 kolumna

11. **Implementacja FeaturesList (`src/components/landing/FeaturesList.astro`)**
    - Import features z data/landing.ts
    - Section heading (H2) + opcjonalny subtitle
    - Grid layout (2×2) na FeatureCard komponenty
    - Map przez features array
    - Responsive: 2 kolumny → 1 kolumna na mobile

12. **Implementacja Testimonials (`src/components/landing/Testimonials.astro`)**
    - Import testimonials z data/landing.ts
    - Section heading
    - Flex/grid layout na TestimonialCard
    - Conditional rendering (sekcja opcjonalna)
    - Opcjonalnie: carousel logic dla większej liczby testimoniali

13. **Implementacja TestimonialCard (`src/components/landing/TestimonialCard.astro`)**
    - Props: testimonial (Testimonial type)
    - Layout: avatar + content + author + role
    - Stylowanie: quote marks, card border
    - Fallback dla brakującego avatara

14. **Implementacja CTASection (`src/components/landing/CTASection.astro`)**
    - Heading (H2) + description
    - Button komponent z linkiem do /register
    - Kontrastowy background (gradient)
    - Centrowanie zawartości

15. **Implementacja Footer i FooterSection**
    - `FooterSection.astro`: Props section (FooterSection type)
    - Title (H3/H4) + lista linków (ul > li > a)
    - Obsługa external links (target="_blank", rel="noopener")
    - `Footer.astro`: Import footerSections z data
    - Grid layout (3-4 kolumny → stack na mobile)
    - Map przez sections i renderowanie FooterSection
    - Copyright section na dole

### Faza 4: Integracja i strona główna (1 dzień)

16. **Implementacja `src/pages/index.astro`**
    - Import wszystkich komponentów sekcji
    - Import SEO component
    - Layout strony:
      ```astro
      ---
      import SEO from '../components/SEO.astro';
      import Hero from '../components/landing/Hero.astro';
      import HowItWorks from '../components/landing/HowItWorks.astro';
      import FeaturesList from '../components/landing/FeaturesList.astro';
      import Testimonials from '../components/landing/Testimonials.astro';
      import CTASection from '../components/landing/CTASection.astro';
      import Footer from '../components/landing/Footer.astro';
      ---

      <html lang="pl">
        <head>
          <SEO
            title="mkrew - Platforma dla dawców krwi w Polsce"
            description="Monitoruj stany krwi w RCKiK, prowadź dziennik donacji i otrzymuj powiadomienia"
          />
        </head>
        <body>
          <Hero />
          <HowItWorks />
          <FeaturesList />
          <Testimonials />
          <CTASection />
          <Footer />
        </body>
      </html>
      ```

### Faza 5: Stylowanie i responsywność (2-3 dni)

17. **Responsive Design**
    - Implementacja media queries dla wszystkich komponentów
    - Mobile-first approach
    - Breakpoints: mobile (<640px), tablet (640-1024px), desktop (>1024px)
    - Testowanie na różnych urządzeniach (DevTools)

18. **Stylowanie szczegółowe**
    - Spacing (padding, margin) zgodny z design system
    - Typography hierarchy (font sizes, weights, line heights)
    - Colors zgodne z brand identity
    - Hover states, transitions, animations
    - Focus states dla accessibility

19. **Optimizacja obrazów**
    - Konwersja do WebP
    - Responsive images (`<picture>`, srcset)
    - Lazy loading dla obrazów poniżej fold
    - Alt texts dla wszystkich obrazów

### Faza 6: Accessibility i SEO (1-2 dni)

20. **Accessibility**
    - Semantyczne HTML (nav, main, section, article, footer)
    - ARIA labels gdzie potrzeba
    - Keyboard navigation (Tab order, focus indicators)
    - Color contrast sprawdzenie (WCAG 2.1 AA minimum)
    - Screen reader testing
    - Alt texts dla wszystkich obrazów

21. **SEO**
    - Meta tags optymalizacja
    - Open Graph i Twitter Cards
    - Structured data (JSON-LD) - opcjonalnie
    - Sitemap.xml generation
    - Robots.txt konfiguracja
    - Canonical URLs

### Faza 7: Testowanie (2-3 dni)

22. **Testy wizualne**
    - Visual regression tests (Playwright lub Chromatic)
    - Cross-browser testing (Chrome, Firefox, Safari, Edge)
    - Responsive design testing (mobile, tablet, desktop)

23. **Testy funkcjonalne**
    - E2E tests dla navigation flows (Playwright)
    - Link testing (wszystkie linki działają poprawnie)
    - Button interactions testing

24. **Testy accessibility**
    - Axe-core lub Lighthouse accessibility audit
    - Keyboard navigation manual testing
    - Screen reader testing (NVDA, JAWS lub VoiceOver)

25. **Performance testing**
    - Lighthouse audit (Performance, Best Practices, SEO)
    - WebPageTest analysis
    - Core Web Vitals (LCP, FID, CLS)
    - Optymalizacje jeśli potrzebne:
      - Code splitting
      - CSS/JS minification
      - Image optimization
      - Lazy loading

### Faza 8: Dokumentacja i przekazanie (1 dzień)

26. **Dokumentacja**
    - README dla Landing Page
    - Instrukcje edycji contentu (data/landing.ts)
    - Styleguide dla komponentów
    - Accessibility checklist

27. **Code review i refactoring**
    - Review kodu
    - Refactoring duplikacji
    - Optymalizacja performance
    - Comments dla skomplikowanych części

28. **Deployment**
    - Build production (`npm run build`)
    - Weryfikacja build output
    - Deploy do staging/production
    - Smoke testing na production

### Podsumowanie timeline

- **Faza 1-2**: 3-5 dni (Setup + Komponenty podstawowe)
- **Faza 3-4**: 4-5 dni (Sekcje + Integracja)
- **Faza 5-6**: 3-5 dni (Stylowanie + A11y + SEO)
- **Faza 7-8**: 3-4 dni (Testowanie + Dokumentacja)

**Całkowity szacowany czas: 13-19 dni roboczych** (2.5-4 tygodnie dla jednego dewelopera)

### Priorytety (jeśli czas jest ograniczony)

**Must have (MVP)**:
- Hero, FeaturesList, Footer
- Button komponent
- SEO basics
- Mobile responsive
- Basic accessibility

**Should have**:
- HowItWorks section
- CTASection
- Advanced SEO (OG tags)
- Animations/transitions

**Nice to have**:
- Testimonials section
- Advanced animations
- Carousel dla testimoniali
- Structured data

---

## Dodatkowe uwagi

### Design System
Przed rozpoczęciem implementacji warto stworzyć prosty design system lub style guide:
- Paleta kolorów (primary, secondary, accent, neutrals)
- Typography scale (H1-H6, body, small)
- Spacing scale (4px, 8px, 16px, 24px, 32px, etc.)
- Border radius values
- Shadow definitions

### Narzędzia
- **Figma/Sketch**: Mockupy i prototypy (jeśli dostępne)
- **Storybook**: Izolowane komponenty UI (opcjonalnie)
- **Playwright**: E2E testing
- **Lighthouse CI**: Performance monitoring
- **axe DevTools**: Accessibility testing

### Best Practices
- Mobile-first approach
- Progressive enhancement
- Semantic HTML
- WCAG 2.1 AA compliance
- GDPR compliance (cookie consent, privacy policy)
- Performance budget (< 3s TTI, < 2.5s LCP)
