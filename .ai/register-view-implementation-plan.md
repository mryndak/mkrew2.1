# Plan implementacji widoku Rejestracji (Multi-step)

## 1. Przegląd

Widok rejestracji to strona umożliwiająca nowym użytkownikom utworzenie konta w aplikacji mkrew. Proces rejestracji jest podzielony na trzy kroki (multi-step form) dla lepszej UX i stopniowego zbierania danych. Po pomyślnej rejestracji użytkownik otrzymuje email weryfikacyjny i jest przekierowany do strony z instrukcjami. Widok jest renderowany server-side (SSR) z interaktywnymi elementami formularza jako React islands. Draft formularza jest zapisywany w sessionStorage (bez hasła dla bezpieczeństwa), co pozwala na wznowienie procesu po przypadkowym zamknięciu strony.

**Kroki rejestracji:**
1. **Krok 1**: Email, hasło (z strength indicator), zgody (privacy policy, consent)
2. **Krok 2**: Imię, nazwisko, grupa krwi (opcjonalna)
3. **Krok 3**: Wybór ulubionych RCKiK (opcjonalny) - multi-select z mapą i listą

## 2. Routing widoku

- **Ścieżka**: `/register`
- **Plik**: `src/pages/register.astro`
- **Typ renderowania**: Server-Side Rendering (SSR)
- **Dostępność**: Publiczna (niezalogowani użytkownicy)
- **Redirect logic**:
  - Jeśli użytkownik jest już zalogowany → redirect do `/dashboard`
  - Po pomyślnej rejestracji → redirect do `/verify-email-pending`

## 3. Struktura komponentów

```
RegisterPage (src/pages/register.astro)
├── AuthLayout
│   ├── SEO (meta tags)
│   └── Navbar (minimal, logo + link do home)
├── Main Container
│   ├── Header
│   │   ├── H1: "Zarejestruj się"
│   │   └── Description: "Dołącz do społeczności dawców krwi"
│   ├── ProgressBar (pokazuje aktualny krok)
│   │   └── Steps: [1, 2, 3] z visual indicators
│   ├── RegisterForm (React island, client:load)
│   │   ├── MultiStepFormContainer
│   │   │   ├── Step1Form (conditional, currentStep === 1)
│   │   │   │   ├── EmailInput
│   │   │   │   │   ├── Label
│   │   │   │   │   ├── Input (type="email")
│   │   │   │   │   ├── EmailUniquenessCheck (async validation, debounced)
│   │   │   │   │   └── FieldError (conditional)
│   │   │   │   ├── PasswordInput
│   │   │   │   │   ├── Label
│   │   │   │   │   ├── Input (type="password")
│   │   │   │   │   ├── ToggleVisibilityButton
│   │   │   │   │   ├── PasswordStrength (live indicator)
│   │   │   │   │   ├── PasswordRequirementsChecklist
│   │   │   │   │   └── FieldError (conditional)
│   │   │   │   ├── ConfirmPasswordInput
│   │   │   │   │   ├── Label
│   │   │   │   │   ├── Input (type="password")
│   │   │   │   │   └── FieldError (conditional)
│   │   │   │   ├── ConsentCheckboxes
│   │   │   │   │   ├── PrivacyPolicyCheckbox
│   │   │   │   │   │   ├── Checkbox
│   │   │   │   │   │   ├── Label z linkiem do polityki
│   │   │   │   │   │   └── FieldError (conditional)
│   │   │   │   │   └── MarketingConsentCheckbox (optional)
│   │   │   │   └── NextButton
│   │   │   ├── Step2Form (conditional, currentStep === 2)
│   │   │   │   ├── FirstNameInput
│   │   │   │   │   ├── Label
│   │   │   │   │   ├── Input (type="text")
│   │   │   │   │   └── FieldError (conditional)
│   │   │   │   ├── LastNameInput
│   │   │   │   │   ├── Label
│   │   │   │   │   ├── Input (type="text")
│   │   │   │   │   └── FieldError (conditional)
│   │   │   │   ├── BloodGroupSelect
│   │   │   │   │   ├── Label
│   │   │   │   │   ├── Select/Dropdown (8 opcji + "Nie wiem/Wolę nie podawać")
│   │   │   │   │   └── FieldError (conditional)
│   │   │   │   ├── PreviousButton
│   │   │   │   └── NextButton
│   │   │   └── Step3Form (conditional, currentStep === 3)
│   │   │       ├── FavoritesPicker
│   │   │       │   ├── SearchInput (search RCKiK by name/city)
│   │   │       │   ├── MapView (optional toggle)
│   │   │       │   │   └── InteractiveMap (markers dla RCKiK, click to select)
│   │   │       │   ├── ListView
│   │   │       │   │   └── RckikCheckboxList
│   │   │       │   │       └── RckikCheckboxItem × N
│   │   │       │   │           ├── Checkbox
│   │   │       │   │           ├── RCKiK name + city
│   │   │       │   │           └── Selected count indicator
│   │   │       │   └── SelectedFavorites (pills z remove button)
│   │   │       ├── SkipButton ("Pomiń, dodam później")
│   │   │       ├── PreviousButton
│   │   │       └── SubmitButton ("Zarejestruj się", with loading state)
│   │   └── ErrorMessage (global, conditional)
│   ├── LinksSection
│   │   └── LoginLink: "Masz już konto? Zaloguj się"
│   └── Footer (AuthLayout footer)
```

## 4. Szczegóły komponentów

### RegisterPage (src/pages/register.astro)

- **Opis komponentu**: Główna strona Astro renderowana jako SSR. Odpowiedzialna za strukturę całego widoku, SEO, sprawdzenie czy użytkownik jest już zalogowany (middleware), i przekazanie props do React island.

- **Główne elementy**:
  - `<AuthLayout>` - layout z minimalną nawigacją
  - `<SEO>` component z meta tags
  - `<main>` container z centered layout
  - `<ProgressBar>` - visual indicator kroków
  - `<RegisterForm>` - React island (client:load)
  - `<LinksSection>` - link do logowania

- **Obsługiwane interakcje**:
  - Server-side: sprawdzenie auth state (middleware)
  - Client-side: hydration React island

- **Obsługiwana walidacja**:
  - Middleware: jeśli użytkownik już zalogowany → redirect do `/dashboard`

- **Typy**:
  - `RegisterPageProps`

- **Propsy**:
  ```typescript
  interface RegisterPageProps {
    // Brak props - standalone page
  }
  ```

### ProgressBar (src/components/auth/ProgressBar.tsx)

- **Opis komponentu**: Wskaźnik postępu pokazujący aktualne miejsce w procesie rejestracji (krok 1/3, 2/3, 3/3). Wizualna reprezentacja z aktywnym krokiem highlighted, completed steps z checkmarkiem, i future steps greyed out.

- **Główne elementy**:
  - `<nav aria-label="Registration progress">` - główny container
  - `<ol>` - ordered list kroków
    - `<li>` × 3 - każdy krok
      - `<span>` - numer kroku lub checkmark icon (jeśli completed)
      - `<span>` - label ("Konto", "Dane osobowe", "Ulubione")
  - `<div>` - progress bar visual (filled bar pokazująca %)

- **Obsługiwane interakcje**:
  - Brak direct interactions (passive display)
  - Opcjonalnie: click na completed step → go back

- **Obsługiwana walidacja**: Brak

- **Typy**:
  - `ProgressBarProps`

- **Propsy**:
  ```typescript
  interface ProgressBarProps {
    currentStep: number; // 1, 2, or 3
    completedSteps: number[]; // array of completed step numbers
  }
  ```

### RegisterForm (src/components/auth/RegisterForm.tsx)

- **Opis komponentu**: Główny multi-step form container. React component (client:load island) zarządzający stanem całego formularza, nawigacją między krokami, zapisem draftu w sessionStorage, walidacją, i submitem do API. Używa custom hook `useRegisterForm`.

- **Główne elementy**:
  - `<form>` - główny element formularza (no onSubmit na form level, handlery per step)
  - `<ErrorMessage>` - global error (conditional)
  - Conditional rendering per step:
    - `{currentStep === 1 && <Step1Form />}`
    - `{currentStep === 2 && <Step2Form />}`
    - `{currentStep === 3 && <Step3Form />}`

- **Obsługiwane interakcje**:
  - Navigate between steps (Next, Previous, Skip)
  - Save draft to sessionStorage on field change (debounced)
  - Load draft from sessionStorage on mount
  - Submit final form (step 3) → API call
  - Handle success/error responses

- **Obsługiwana walidacja**:
  - Per-step validation przed przejściem do następnego kroku
  - All fields validation przed final submit

- **Typy**:
  - `RegisterFormProps`
  - `RegisterFormData` (all steps combined)
  - `RegisterFormState`

- **Propsy**:
  ```typescript
  interface RegisterFormProps {
    onSuccess?: (response: RegisterResponse) => void; // callback po sukcesie
  }
  ```

### Step1Form (src/components/auth/register/Step1Form.tsx)

- **Opis komponentu**: Pierwszy krok rejestracji - zbiera email, hasło, i zgody. Zawiera asynchroniczną walidację unikalności emaila (debounced API call), password strength indicator, i wymagane checkboxy dla consent.

- **Główne elementy**:
  - `<div>` - step container
  - `<EmailInput>` - pole email
  - `<EmailUniquenessCheck>` - async validation indicator
  - `<PasswordInput>` - pole hasła
  - `<PasswordStrength>` - strength meter (weak/medium/strong)
  - `<PasswordRequirementsChecklist>` - live checklist (✓/✗ per requirement)
  - `<ConfirmPasswordInput>` - potwierdzenie hasła
  - `<ConsentCheckboxes>` - zgody (privacy policy required, marketing optional)
  - `<button type="button" onClick={handleNext}>` - Next button

- **Obsługiwane interakcje**:
  - `onChange` na email → debounce (500ms) → check uniqueness API
  - `onChange` na password → update strength indicator + requirements checklist
  - `onChange` na confirmPassword → validate match
  - `onChange` na checkboxes → update form state
  - Click Next → validate step 1 → go to step 2 (if valid)

- **Obsługiwana walidacja**:
  - **Email**:
    - Required: "Email jest wymagany"
    - Valid format: "Wprowadź prawidłowy adres email"
    - Max length 255: "Email jest zbyt długi"
    - Unique (async): "Ten email jest już zarejestrowany"
  - **Password**:
    - Required: "Hasło jest wymagane"
    - Min length 8: "Hasło musi mieć co najmniej 8 znaków"
    - Must contain uppercase: "Hasło musi zawierać wielką literę"
    - Must contain lowercase: "Hasło musi zawierać małą literę"
    - Must contain digit: "Hasło musi zawierać cyfrę"
    - Must contain special char: "Hasło musi zawierać znak specjalny (@$!%*?&#)"
  - **ConfirmPassword**:
    - Required: "Potwierdź hasło"
    - Must match password: "Hasła muszą się zgadzać"
  - **Consent**:
    - Required (privacy policy): "Musisz zaakceptować politykę prywatności"

- **Typy**:
  - `Step1FormProps`
  - `Step1FormData`

- **Propsy**:
  ```typescript
  interface Step1FormProps {
    formData: Step1FormData;
    errors: Record<string, string>;
    onChange: (field: string, value: any) => void;
    onNext: () => void;
  }
  ```

### EmailUniquenessCheck (src/components/auth/register/EmailUniquenessCheck.tsx)

- **Opis komponentu**: Asynchroniczna walidacja unikalności emaila. Wykonuje debounced API call do backendu sprawdzający czy email już istnieje. Wyświetla loading spinner podczas sprawdzania, checkmark jeśli dostępny, lub error jeśli zajęty.

- **Główne elementy**:
  - `<div>` - inline indicator container
  - Conditional rendering:
    - Loading: `<Spinner>` - "Sprawdzam..."
    - Available: `<CheckIcon>` - "Email dostępny"
    - Taken: `<ErrorIcon>` - "Email już zajęty"

- **Obsługiwane interakcje**:
  - Triggered by onChange w EmailInput
  - Debounce 500ms przed API call
  - Cancel previous call jeśli user wpisuje dalej

- **Obsługiwana walidacja**:
  - Async API call: sprawdzenie czy email exists w bazie
  - Tylko dla valid email format (skip jeśli invalid)

- **Typy**:
  - `EmailUniquenessCheckProps`
  - `EmailCheckStatus` ('idle' | 'checking' | 'available' | 'taken')

- **Propsy**:
  ```typescript
  interface EmailUniquenessCheckProps {
    email: string;
    onResult: (isUnique: boolean) => void; // callback z wynikiem
  }
  ```

### PasswordStrength (src/components/auth/register/PasswordStrength.tsx)

- **Opis komponentu**: Wskaźnik siły hasła (password strength meter). Analizuje hasło na podstawie długości, różnorodności znaków, i complexity. Wyświetla wizualny bar (czerwony/żółty/zielony) i label ("Słabe", "Średnie", "Silne").

- **Główne elementy**:
  - `<div>` - strength meter container
  - `<div>` - progress bar (filled % based on strength)
  - `<span>` - label text ("Słabe" | "Średnie" | "Silne")
  - Color coding:
    - Weak: red (< 40% filled)
    - Medium: yellow (40-70%)
    - Strong: green (> 70%)

- **Obsługiwane interakcje**:
  - Live update podczas wpisywania hasła
  - No direct user interaction

- **Obsługiwana walidacja**:
  - Calculate strength score:
    - Length (longer = better)
    - Character variety (uppercase, lowercase, digits, special)
    - Common patterns (penalize "password123", "qwerty", etc.)

- **Typy**:
  - `PasswordStrengthProps`
  - `PasswordStrength` ('weak' | 'medium' | 'strong')

- **Propsy**:
  ```typescript
  interface PasswordStrengthProps {
    password: string;
  }
  ```

### PasswordRequirementsChecklist (src/components/auth/register/PasswordRequirementsChecklist.tsx)

- **Opis komponentu**: Checklist wymagań dla hasła. Wyświetla listę wszystkich requirements (min 8 chars, uppercase, lowercase, digit, special char) z live checkmarkami (✓/✗) podczas wpisywania hasła.

- **Główne elementy**:
  - `<ul>` - lista wymagań
    - `<li>` × 5 - każde requirement
      - `<CheckIcon>` lub `<XIcon>` - status indicator
      - `<span>` - requirement text
  - Color coding: green checkmark jeśli spełnione, grey X jeśli nie

- **Obsługiwane interakcje**:
  - Live update podczas wpisywania hasła
  - No direct user interaction

- **Obsługiwana walidacja**:
  - Check każde requirement:
    - min 8 chars: `password.length >= 8`
    - uppercase: `/[A-Z]/.test(password)`
    - lowercase: `/[a-z]/.test(password)`
    - digit: `/\d/.test(password)`
    - special char: `/[@$!%*?&#]/.test(password)`

- **Typy**:
  - `PasswordRequirementsChecklistProps`

- **Propsy**:
  ```typescript
  interface PasswordRequirementsChecklistProps {
    password: string;
  }
  ```

### Step2Form (src/components/auth/register/Step2Form.tsx)

- **Opis komponentu**: Drugi krok rejestracji - zbiera dane osobowe (imię, nazwisko, grupa krwi). Prosta forma z 3 polami. Grupa krwi jest opcjonalna.

- **Główne elementy**:
  - `<div>` - step container
  - `<FirstNameInput>` - pole imienia
  - `<LastNameInput>` - pole nazwiska
  - `<BloodGroupSelect>` - dropdown wyboru grupy krwi (opcjonalny)
  - `<button type="button" onClick={handlePrevious}>` - Previous button
  - `<button type="button" onClick={handleNext}>` - Next button

- **Obsługiwane interakcje**:
  - `onChange` na inputach → update form state
  - Click Previous → go back to step 1 (save draft)
  - Click Next → validate step 2 → go to step 3 (if valid)

- **Obsługiwana walidacja**:
  - **FirstName**:
    - Required: "Imię jest wymagane"
    - Max length 100: "Imię jest zbyt długie"
    - No special chars (only letters, hyphens, apostrophes): "Imię może zawierać tylko litery"
  - **LastName**:
    - Required: "Nazwisko jest wymagane"
    - Max length 100: "Nazwisko jest zbyt długie"
    - No special chars: "Nazwisko może zawierać tylko litery"
  - **BloodGroup**:
    - Optional
    - Must be one of: "0+", "0-", "A+", "A-", "B+", "B-", "AB+", "AB-"

- **Typy**:
  - `Step2FormProps`
  - `Step2FormData`

- **Propsy**:
  ```typescript
  interface Step2FormProps {
    formData: Step2FormData;
    errors: Record<string, string>;
    onChange: (field: string, value: any) => void;
    onPrevious: () => void;
    onNext: () => void;
  }
  ```

### BloodGroupSelect (src/components/auth/register/BloodGroupSelect.tsx)

- **Opis komponentu**: Dropdown/Select do wyboru grupy krwi. Zawiera 8 opcji grup krwi + opcja "Nie wiem/Wolę nie podawać" (null value). Opcjonalne pole.

- **Główne elementy**:
  - `<label htmlFor="bloodGroup">` - label "Grupa krwi (opcjonalnie)"
  - `<select id="bloodGroup">` - dropdown
    - `<option value="">Nie wiem / Wolę nie podawać</option>`
    - `<option value="0+">0+</option>`
    - `<option value="0-">0-</option>`
    - `<option value="A+">A+</option>`
    - `<option value="A-">A-</option>`
    - `<option value="B+">B+</option>`
    - `<option value="B-">B-</option>`
    - `<option value="AB+">AB+</option>`
    - `<option value="AB-">AB-</option>`
  - `<FieldError>` (conditional)

- **Obsługiwane interakcje**:
  - `onChange` → update form state

- **Obsługiwana walidacja**:
  - Optional field (może być null/empty)
  - Jeśli podano: musi być z listy valid values

- **Typy**:
  - `BloodGroupSelectProps`
  - `BloodGroup` type

- **Propsy**:
  ```typescript
  interface BloodGroupSelectProps {
    value: BloodGroup | null;
    onChange: (value: BloodGroup | null) => void;
    error?: string;
  }
  ```

### Step3Form (src/components/auth/register/Step3Form.tsx)

- **Opis komponentu**: Trzeci krok rejestracji - wybór ulubionych RCKiK. Opcjonalny krok (można pominąć). Zawiera FavoritesPicker z searchem, opcjonalną mapą, i listą checkboxów. Użytkownik może wybrać wiele centrów.

- **Główne elementy**:
  - `<div>` - step container
  - `<h3>` - "Wybierz ulubione centra krwiodawstwa (opcjonalnie)"
  - `<p>` - description: "Będziesz otrzymywać powiadomienia o niskich stanach w wybranych centrach"
  - `<FavoritesPicker>` - main picker component
  - `<button type="button" onClick={handleSkip}>` - Skip button "Pomiń, dodam później"
  - `<button type="button" onClick={handlePrevious}>` - Previous button
  - `<button type="submit" onClick={handleSubmit}>` - Submit button "Zarejestruj się" (with loading state)

- **Obsługiwane interakcje**:
  - Search RCKiK by name/city
  - Toggle map view (optional)
  - Select/deselect RCKiK (checkboxes or map markers)
  - Remove selected favorite (pill with X button)
  - Click Skip → submit form bez favorites
  - Click Previous → go back to step 2 (save draft)
  - Click Submit → validate all steps → API call

- **Obsługiwana walidacja**:
  - Optional field (może być pusta lista)
  - Jeśli podano: IDs muszą istnieć w systemie (backend validates)

- **Typy**:
  - `Step3FormProps`
  - `Step3FormData`

- **Propsy**:
  ```typescript
  interface Step3FormProps {
    formData: Step3FormData;
    onChange: (field: string, value: any) => void;
    onPrevious: () => void;
    onSkip: () => void;
    onSubmit: () => void;
    isSubmitting: boolean;
  }
  ```

### FavoritesPicker (src/components/auth/register/FavoritesPicker.tsx)

- **Opis komponentu**: Komponent do wyboru ulubionych RCKiK. Zawiera search input, opcjonalny toggle dla map view, listę checkboxów z RCKiK, i wybraną listę (pills). Pozwala na multi-select.

- **Główne elementy**:
  - `<div>` - picker container
  - `<SearchInput>` - search by name/city (debounced)
  - `<ToggleMapButton>` - "Pokaż mapę" / "Pokaż listę" (optional feature)
  - Conditional rendering:
    - Map view: `<InteractiveMap>` (client:load, Leaflet/Mapbox)
    - List view: `<RckikCheckboxList>`
  - `<SelectedFavorites>` - pills z wybranymi (z remove button)
  - `<div>` - count indicator: "Wybrano X centrów"

- **Obsługiwane interakcje**:
  - Search input → filter lista
  - Toggle map/list view
  - Click checkbox → add/remove from selected
  - Click map marker → add/remove from selected
  - Click X na pill → remove from selected

- **Obsługiwana walidacja**:
  - No validation (optional, multi-select)

- **Typy**:
  - `FavoritesPickerProps`
  - `RckikBasic` (id, name, city, latitude, longitude)

- **Propsy**:
  ```typescript
  interface FavoritesPickerProps {
    selectedIds: number[];
    onChange: (selectedIds: number[]) => void;
    rckikList: RckikBasic[]; // lista dostępnych RCKiK
  }
  ```

### RckikCheckboxList (src/components/auth/register/RckikCheckboxList.tsx)

- **Opis komponentu**: Lista checkboxów z RCKiK. Wyświetla wszystkie dostępne centra (filtered by search) jako checkboxy. Użytkownik może zaznaczyć wiele.

- **Główne elementy**:
  - `<div>` - list container
  - `<ul>` - lista RCKiK
    - `<li>` × N - każde centrum
      - `<RckikCheckboxItem>`

- **Obsługiwane interakcje**:
  - Click na checkbox → toggle selected
  - Keyboard navigation (Space to toggle)

- **Obsługiwana walidacja**: Brak

- **Typy**:
  - `RckikCheckboxListProps`

- **Propsy**:
  ```typescript
  interface RckikCheckboxListProps {
    items: RckikBasic[];
    selectedIds: number[];
    onToggle: (id: number) => void;
  }
  ```

### RckikCheckboxItem (src/components/auth/register/RckikCheckboxItem.tsx)

- **Opis komponentu**: Pojedynczy checkbox item dla RCKiK. Wyświetla checkbox, nazwę centrum, miasto, i optional badge (jeśli już wybrany).

- **Główne elementy**:
  - `<label>` - wrapping label (click anywhere to toggle)
  - `<input type="checkbox">` - checkbox
  - `<div>` - content
    - `<span>` - RCKiK name (bold)
    - `<span>` - city (grey, smaller)
  - `<CheckIcon>` (conditional, jeśli selected)

- **Obsługiwane interakcje**:
  - Click → toggle checked

- **Obsługiwana walidacja**: Brak

- **Typy**:
  - `RckikCheckboxItemProps`

- **Propsy**:
  ```typescript
  interface RckikCheckboxItemProps {
    rckik: RckikBasic;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }
  ```

### InteractiveMap (src/components/common/InteractiveMap.tsx)

- **Opis komponentu**: Mapa interaktywna (Leaflet lub Mapbox) pokazująca markery dla wszystkich RCKiK. Click na marker → select/deselect centrum. Opcjonalny komponent (można toggle między mapą a listą).

- **Główne elementy**:
  - `<div id="map">` - map container
  - Leaflet/Mapbox map instance
  - Markers dla każdego RCKiK (color coded: grey = not selected, blue = selected)
  - Popup na marker click (nazwa, miasto, checkbox)

- **Obsługiwane interakcje**:
  - Click na marker → open popup z checkbox
  - Click checkbox w popup → toggle selected
  - Zoom, pan map (standard map interactions)

- **Obsługiwana walidacja**: Brak

- **Typy**:
  - `InteractiveMapProps`

- **Propsy**:
  ```typescript
  interface InteractiveMapProps {
    rckikList: RckikBasic[];
    selectedIds: number[];
    onToggle: (id: number) => void;
    center?: [number, number]; // default center coordinates
    zoom?: number; // default zoom level
  }
  ```

### SelectedFavorites (src/components/auth/register/SelectedFavorites.tsx)

- **Opis komponentu**: Wyświetla wybrane ulubione RCKiK jako pills (badges) z przyciskiem remove (X). Pozwala na szybkie usunięcie wybranego centrum.

- **Główne elementy**:
  - `<div>` - pills container
  - `<div>` × N - pill dla każdego selected RCKiK
    - `<span>` - RCKiK name
    - `<button type="button">` - remove button (X icon)

- **Obsługiwane interakcje**:
  - Click X → remove from selected

- **Obsługiwana walidacja**: Brak

- **Typy**:
  - `SelectedFavoritesProps`

- **Propsy**:
  ```typescript
  interface SelectedFavoritesProps {
    selectedRckiks: RckikBasic[];
    onRemove: (id: number) => void;
  }
  ```

## 5. Typy

Wszystkie typy zdefiniowane w `src/types/auth.ts` (rozszerzenie dla rejestracji):

```typescript
// ===== API Request/Response Types =====

/**
 * Request body dla POST /api/v1/auth/register
 * Backend: RegisterRequest.java
 */
export interface RegisterRequest {
  email: string; // Required, valid email, max 255
  password: string; // Required, min 8, complexity rules
  firstName: string; // Required, max 100
  lastName: string; // Required, max 100
  bloodGroup?: BloodGroup | null; // Optional
  favoriteRckikIds?: number[]; // Optional array of RCKiK IDs
  consentVersion: string; // Required, current policy version (e.g., "1.0")
  consentAccepted: boolean; // Required, must be true
}

/**
 * Response body z POST /api/v1/auth/register
 * Backend: RegisterResponse.java
 */
export interface RegisterResponse {
  userId: number;
  email: string;
  emailVerified: boolean; // Always false initially
  message: string; // "Registration successful. Please check your email to verify your account."
}

// ===== Form Data Types =====

/**
 * Complete form data dla wszystkich kroków rejestracji
 */
export interface RegisterFormData {
  // Step 1
  email: string;
  password: string;
  confirmPassword: string; // Not sent to API, tylko frontend validation
  consentAccepted: boolean;
  marketingConsent?: boolean; // Optional, not sent to API in MVP

  // Step 2
  firstName: string;
  lastName: string;
  bloodGroup?: BloodGroup | null;

  // Step 3
  favoriteRckikIds: number[];
}

/**
 * Step 1 form data
 */
export interface Step1FormData {
  email: string;
  password: string;
  confirmPassword: string;
  consentAccepted: boolean;
  marketingConsent?: boolean;
}

/**
 * Step 2 form data
 */
export interface Step2FormData {
  firstName: string;
  lastName: string;
  bloodGroup?: BloodGroup | null;
}

/**
 * Step 3 form data
 */
export interface Step3FormData {
  favoriteRckikIds: number[];
}

/**
 * Blood group type
 */
export type BloodGroup = '0+' | '0-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';

/**
 * Valid blood groups array (for dropdown options)
 */
export const BLOOD_GROUPS: BloodGroup[] = [
  '0+', '0-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'
];

// ===== Validation Schema (Zod) =====

import { z } from 'zod';

/**
 * Password regex pattern (same as backend)
 * Must contain: uppercase, lowercase, digit, special char
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/;

/**
 * Name regex pattern (only letters, hyphens, apostrophes)
 */
const NAME_REGEX = /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s'-]+$/;

/**
 * Step 1 validation schema
 */
export const step1Schema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Wprowadź prawidłowy adres email')
    .max(255, 'Email jest zbyt długi'),
  password: z
    .string()
    .min(8, 'Hasło musi mieć co najmniej 8 znaków')
    .regex(PASSWORD_REGEX, 'Hasło nie spełnia wymagań złożoności'),
  confirmPassword: z.string().min(1, 'Potwierdź hasło'),
  consentAccepted: z
    .boolean()
    .refine((val) => val === true, 'Musisz zaakceptować politykę prywatności'),
  marketingConsent: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasła muszą się zgadzać',
  path: ['confirmPassword'],
});

export type Step1FormSchema = z.infer<typeof step1Schema>;

/**
 * Step 2 validation schema
 */
export const step2Schema = z.object({
  firstName: z
    .string()
    .min(1, 'Imię jest wymagane')
    .max(100, 'Imię jest zbyt długie')
    .regex(NAME_REGEX, 'Imię może zawierać tylko litery'),
  lastName: z
    .string()
    .min(1, 'Nazwisko jest wymagane')
    .max(100, 'Nazwisko jest zbyt długie')
    .regex(NAME_REGEX, 'Nazwisko może zawierać tylko litery'),
  bloodGroup: z
    .enum(['0+', '0-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'])
    .nullable()
    .optional(),
});

export type Step2FormSchema = z.infer<typeof step2Schema>;

/**
 * Step 3 validation schema (no validation, optional)
 */
export const step3Schema = z.object({
  favoriteRckikIds: z.array(z.number()).optional().default([]),
});

export type Step3FormSchema = z.infer<typeof step3Schema>;

/**
 * Full form validation schema (combines all steps)
 */
export const registerSchema = z.object({
  ...step1Schema.shape,
  ...step2Schema.shape,
  ...step3Schema.shape,
});

// ===== Component State Types =====

/**
 * State hooka useRegisterForm
 */
export interface RegisterFormState {
  currentStep: number; // 1, 2, or 3
  formData: RegisterFormData;
  errors: Record<string, string>; // field errors
  isSubmitting: boolean;
  globalError: string | null; // API error message
  emailCheckStatus: EmailCheckStatus;
  isEmailUnique: boolean | null; // null = not checked yet
}

/**
 * Email uniqueness check status
 */
export type EmailCheckStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'medium' | 'strong';

/**
 * Password requirements check result
 */
export interface PasswordRequirements {
  minLength: boolean; // >= 8 chars
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
  hasSpecialChar: boolean;
}

// ===== RCKiK Types (for FavoritesPicker) =====

/**
 * Basic RCKiK data for picker
 */
export interface RckikBasic {
  id: number;
  name: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
}

// ===== Component Props Types =====

/**
 * Props dla RegisterForm
 */
export interface RegisterFormProps {
  onSuccess?: (response: RegisterResponse) => void;
}

/**
 * Props dla ProgressBar
 */
export interface ProgressBarProps {
  currentStep: number;
  completedSteps: number[];
}

/**
 * Props dla Step1Form
 */
export interface Step1FormProps {
  formData: Step1FormData;
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
  onNext: () => void;
}

/**
 * Props dla EmailUniquenessCheck
 */
export interface EmailUniquenessCheckProps {
  email: string;
  onResult: (isUnique: boolean) => void;
}

/**
 * Props dla PasswordStrength
 */
export interface PasswordStrengthProps {
  password: string;
}

/**
 * Props dla PasswordRequirementsChecklist
 */
export interface PasswordRequirementsChecklistProps {
  password: string;
}

/**
 * Props dla Step2Form
 */
export interface Step2FormProps {
  formData: Step2FormData;
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
  onPrevious: () => void;
  onNext: () => void;
}

/**
 * Props dla BloodGroupSelect
 */
export interface BloodGroupSelectProps {
  value: BloodGroup | null;
  onChange: (value: BloodGroup | null) => void;
  error?: string;
}

/**
 * Props dla Step3Form
 */
export interface Step3FormProps {
  formData: Step3FormData;
  onChange: (field: string, value: any) => void;
  onPrevious: () => void;
  onSkip: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

/**
 * Props dla FavoritesPicker
 */
export interface FavoritesPickerProps {
  selectedIds: number[];
  onChange: (selectedIds: number[]) => void;
  rckikList: RckikBasic[];
}

/**
 * Props dla RckikCheckboxList
 */
export interface RckikCheckboxListProps {
  items: RckikBasic[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}

/**
 * Props dla RckikCheckboxItem
 */
export interface RckikCheckboxItemProps {
  rckik: RckikBasic;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Props dla InteractiveMap
 */
export interface InteractiveMapProps {
  rckikList: RckikBasic[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  center?: [number, number];
  zoom?: number;
}

/**
 * Props dla SelectedFavorites
 */
export interface SelectedFavoritesProps {
  selectedRckiks: RckikBasic[];
  onRemove: (id: number) => void;
}

// ===== Utility Functions =====

/**
 * Calculate password strength
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) return 'weak';

  let score = 0;

  // Length
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Character variety
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 15;
  if (/[@$!%*?&#]/.test(password)) score += 15;

  // Penalty for common patterns
  if (/^password/i.test(password)) score -= 20;
  if (/123/.test(password)) score -= 10;
  if (/^(.)\1+$/.test(password)) score -= 20; // all same character

  if (score < 40) return 'weak';
  if (score < 70) return 'medium';
  return 'strong';
}

/**
 * Check password requirements
 */
export function checkPasswordRequirements(password: string): PasswordRequirements {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasDigit: /\d/.test(password),
    hasSpecialChar: /[@$!%*?&#]/.test(password),
  };
}

/**
 * Get session storage key for draft
 */
export const REGISTER_DRAFT_KEY = 'register_draft';

/**
 * Save registration draft to sessionStorage (bez hasła!)
 */
export function saveRegistrationDraft(formData: RegisterFormData): void {
  try {
    const draftData = {
      ...formData,
      password: '', // NEVER store password
      confirmPassword: '', // NEVER store password
    };
    sessionStorage.setItem(REGISTER_DRAFT_KEY, JSON.stringify(draftData));
  } catch (error) {
    console.warn('Failed to save registration draft:', error);
  }
}

/**
 * Load registration draft from sessionStorage
 */
export function loadRegistrationDraft(): Partial<RegisterFormData> | null {
  try {
    const stored = sessionStorage.getItem(REGISTER_DRAFT_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Failed to load registration draft:', error);
    return null;
  }
}

/**
 * Clear registration draft from sessionStorage
 */
export function clearRegistrationDraft(): void {
  try {
    sessionStorage.removeItem(REGISTER_DRAFT_KEY);
  } catch (error) {
    console.warn('Failed to clear registration draft:', error);
  }
}
```

## 6. Zarządzanie stanem

### 6.1 Strategia zarządzania stanem

Widok rejestracji wymaga zarządzania **lokalnym stanem multi-step formularza** (React hooks) z dodatkiem **sessionStorage persistence** dla draftu.

### 6.2 Stan lokalny (React hooks)

**Custom hook: useRegisterForm**

Główny hook zarządzający całym procesem rejestracji - nawigacja między krokami, walidacja per-step, draft persistence, email uniqueness check, i final submit.

Lokalizacja: `src/lib/hooks/useRegisterForm.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser, checkEmailUniqueness } from '@/lib/api/endpoints/auth';
import { useDebounce } from './useDebounce';
import type {
  RegisterFormState,
  RegisterFormData,
  RegisterRequest,
  EmailCheckStatus,
} from '@/types/auth';
import {
  step1Schema,
  step2Schema,
  step3Schema,
  saveRegistrationDraft,
  loadRegistrationDraft,
  clearRegistrationDraft,
} from '@/types/auth';

const INITIAL_FORM_DATA: RegisterFormData = {
  email: '',
  password: '',
  confirmPassword: '',
  consentAccepted: false,
  marketingConsent: false,
  firstName: '',
  lastName: '',
  bloodGroup: null,
  favoriteRckikIds: [],
};

export function useRegisterForm() {
  const router = useRouter();

  // Load draft from sessionStorage on mount
  const [formData, setFormData] = useState<RegisterFormData>(() => {
    const draft = loadRegistrationDraft();
    return draft ? { ...INITIAL_FORM_DATA, ...draft } : INITIAL_FORM_DATA;
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [emailCheckStatus, setEmailCheckStatus] = useState<EmailCheckStatus>('idle');
  const [isEmailUnique, setIsEmailUnique] = useState<boolean | null>(null);

  // Debounced email for uniqueness check
  const debouncedEmail = useDebounce(formData.email, 500);

  // Check email uniqueness when debounced email changes
  useEffect(() => {
    if (!debouncedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(debouncedEmail)) {
      setEmailCheckStatus('idle');
      setIsEmailUnique(null);
      return;
    }

    const checkEmail = async () => {
      setEmailCheckStatus('checking');
      try {
        const isUnique = await checkEmailUniqueness(debouncedEmail);
        setIsEmailUnique(isUnique);
        setEmailCheckStatus(isUnique ? 'available' : 'taken');

        if (!isUnique) {
          setErrors((prev) => ({
            ...prev,
            email: 'Ten email jest już zarejestrowany',
          }));
        } else {
          setErrors((prev) => {
            const { email, ...rest } = prev;
            return rest;
          });
        }
      } catch (error) {
        setEmailCheckStatus('error');
        console.error('Email uniqueness check failed:', error);
      }
    };

    checkEmail();
  }, [debouncedEmail]);

  // Save draft to sessionStorage on formData change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveRegistrationDraft(formData);
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData]);

  // Update form field
  const updateField = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors((prev) => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // Validate current step
  const validateStep = useCallback((step: number): boolean => {
    setErrors({});

    try {
      if (step === 1) {
        step1Schema.parse({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          consentAccepted: formData.consentAccepted,
          marketingConsent: formData.marketingConsent,
        });

        // Check email uniqueness
        if (!isEmailUnique) {
          setErrors({ email: 'Ten email jest już zarejestrowany' });
          return false;
        }
      } else if (step === 2) {
        step2Schema.parse({
          firstName: formData.firstName,
          lastName: formData.lastName,
          bloodGroup: formData.bloodGroup,
        });
      } else if (step === 3) {
        step3Schema.parse({
          favoriteRckikIds: formData.favoriteRckikIds,
        });
      }
      return true;
    } catch (error: any) {
      if (error.errors) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  }, [formData, isEmailUnique]);

  // Navigate to next step
  const goToNextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, validateStep]);

  // Navigate to previous step
  const goToPreviousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  }, []);

  // Skip step 3
  const skipStep3 = useCallback(() => {
    setFormData((prev) => ({ ...prev, favoriteRckikIds: [] }));
    handleSubmit();
  }, [formData]);

  // Submit form
  const handleSubmit = useCallback(async () => {
    // Validate all steps
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      // Go back to first invalid step
      if (!validateStep(1)) setCurrentStep(1);
      else if (!validateStep(2)) setCurrentStep(2);
      return;
    }

    setIsSubmitting(true);
    setGlobalError(null);

    try {
      // Prepare request data
      const requestData: RegisterRequest = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        bloodGroup: formData.bloodGroup || undefined,
        favoriteRckikIds: formData.favoriteRckikIds.length > 0 ? formData.favoriteRckikIds : undefined,
        consentVersion: '1.0', // Current policy version
        consentAccepted: formData.consentAccepted,
      };

      // API call
      const response = await registerUser(requestData);

      // Success: clear draft, redirect to verify-email-pending
      clearRegistrationDraft();
      router.push('/verify-email-pending');
    } catch (error: any) {
      if (error.response?.status === 409) {
        // Email already exists (conflict)
        setGlobalError('Ten email jest już zarejestrowany');
        setCurrentStep(1); // Go back to step 1
        setErrors({ email: 'Ten email jest już zarejestrowany' });
      } else if (error.response?.status === 400) {
        // Validation error from backend
        const errorData = error.response.data;
        setGlobalError(errorData.message || 'Sprawdź poprawność danych');

        if (errorData.details) {
          const fieldErrors: Record<string, string> = {};
          errorData.details.forEach((detail: any) => {
            fieldErrors[detail.field] = detail.message;
          });
          setErrors(fieldErrors);
        }
      } else if (error.response?.status === 429) {
        // Rate limit
        setGlobalError('Zbyt wiele prób rejestracji. Spróbuj ponownie później.');
      } else {
        // Generic error
        setGlobalError('Wystąpił błąd podczas rejestracji. Spróbuj ponownie.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateStep, router]);

  return {
    formData,
    currentStep,
    completedSteps,
    errors,
    isSubmitting,
    globalError,
    emailCheckStatus,
    isEmailUnique,
    updateField,
    goToNextStep,
    goToPreviousStep,
    skipStep3,
    handleSubmit,
  };
}
```

**Custom hook: useDebounce**

Już zdefiniowany w poprzednim planie (login), używamy tego samego.

### 6.3 SessionStorage persistence

**Draft Management**:
- Save draft to sessionStorage on every field change (debounced 1 second)
- Load draft from sessionStorage on component mount
- **SECURITY**: Hasło NIE jest zapisywane w sessionStorage (tylko placeholder)
- Clear draft po pomyślnej rejestracji

**Implementacja** (w typach, sekcja 5):
- `saveRegistrationDraft(formData)` - save (bez hasła)
- `loadRegistrationDraft()` - load
- `clearRegistrationDraft()` - clear

## 7. Integracja API

### 7.1 Endpoints

#### 1. Register User

**POST /api/v1/auth/register**

Rejestracja nowego użytkownika.

**Request**:

**Method**: POST

**Headers**:
- `Content-Type: application/json`

**Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "Jan",
  "lastName": "Kowalski",
  "bloodGroup": "A+",
  "favoriteRckikIds": [1, 3, 5],
  "consentVersion": "1.0",
  "consentAccepted": true
}
```

**Response**:

**Success (201 Created)**:
```json
{
  "userId": 123,
  "email": "user@example.com",
  "emailVerified": false,
  "message": "Registration successful. Please check your email to verify your account."
}
```

**Error (400 Bad Request)** - Validation error:
```json
{
  "timestamp": "2025-01-08T17:30:00Z",
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "path": "/api/v1/auth/register",
  "details": [
    {
      "field": "email",
      "message": "Email is already registered",
      "rejectedValue": "user@example.com"
    }
  ]
}
```

**Error (409 Conflict)** - Email already exists:
```json
{
  "timestamp": "2025-01-08T17:30:00Z",
  "status": 409,
  "error": "CONFLICT",
  "message": "Email is already registered",
  "path": "/api/v1/auth/register"
}
```

**Error (429 Too Many Requests)** - Rate limit:
```json
{
  "timestamp": "2025-01-08T17:30:00Z",
  "status": 429,
  "error": "TOO_MANY_REQUESTS",
  "message": "Too many registration attempts. Please try again later.",
  "path": "/api/v1/auth/register"
}
```

#### 2. Check Email Uniqueness

**GET /api/v1/auth/check-email?email=user@example.com**

Sprawdza czy email jest dostępny (nie istnieje w bazie).

**Request**:

**Method**: GET

**Query Parameters**:
- `email` (required): Email to check

**Response**:

**Success (200 OK)**:
```json
{
  "available": true
}
```

Lub:
```json
{
  "available": false
}
```

### 7.2 API Client Implementation

Lokalizacja: `src/lib/api/endpoints/auth.ts` (rozszerzenie)

```typescript
import { apiClient } from '@/lib/api/client';
import type { RegisterRequest, RegisterResponse } from '@/types/auth';

/**
 * Register new user
 * Endpoint: POST /api/v1/auth/register
 */
export async function registerUser(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>('/auth/register', data);
  return response.data;
}

/**
 * Check email uniqueness
 * Endpoint: GET /api/v1/auth/check-email
 */
export async function checkEmailUniqueness(email: string): Promise<boolean> {
  const response = await apiClient.get<{ available: boolean }>(
    `/auth/check-email?email=${encodeURIComponent(email)}`
  );
  return response.data.available;
}
```

## 8. Interakcje użytkownika

| Interakcja użytkownika | Akcja frontendowa | API Call | Oczekiwany wynik |
|------------------------|-------------------|----------|------------------|
| **Załadowanie strony `/register`** | - SSR render page<br>- Load draft from sessionStorage<br>- Check if already logged in (middleware) | Brak | Wyświetlenie formularza rejestracji (krok 1). Jeśli draft exists → restore fields (bez hasła). Jeśli już zalogowany → redirect do `/dashboard`. |
| **Wpisanie email (krok 1)** | - onChange event<br>- Update form state<br>- Debounce 500ms<br>- Check uniqueness API | `GET /api/v1/auth/check-email?email=...` | Live indicator: "Sprawdzam..." → "Email dostępny" (✓) lub "Email zajęty" (✗). Error jeśli zajęty. |
| **Wpisanie hasła (krok 1)** | - onChange event<br>- Update form state<br>- Update PasswordStrength indicator<br>- Update PasswordRequirementsChecklist | Brak | Live strength meter (red/yellow/green). Live checklist (✓/✗ per requirement). |
| **Wpisanie confirm password (krok 1)** | - onChange event<br>- Update form state<br>- Validate match with password | Brak | Error jeśli nie pasuje: "Hasła muszą się zgadzać". |
| **Zaznaczenie consent checkbox (krok 1)** | - onChange event<br>- Update form state<br>- Required validation | Brak | Checkbox zaznaczony. Error znika jeśli był. |
| **Click "Dalej" (krok 1)** | - onClick event<br>- Validate step 1 (Zod schema + email unique)<br>- If valid: save draft → go to step 2<br>- If invalid: show field errors | Brak (validation local) | **Sukces**: Przejście do kroku 2, ProgressBar update (krok 1 completed).<br>**Błąd**: Error messages pod fields, focus na pierwszym błędnym. |
| **Wpisanie firstName/lastName (krok 2)** | - onChange event<br>- Update form state<br>- Clear field error | Brak | Aktualizacja stanu, error znika. |
| **Wybór blood group (krok 2)** | - onChange event<br>- Update form state | Brak | Dropdown value selected. |
| **Click "Wstecz" (krok 2)** | - onClick event<br>- Save draft<br>- Go to step 1 | Brak | Powrót do kroku 1, dane zachowane (draft). |
| **Click "Dalej" (krok 2)** | - onClick event<br>- Validate step 2 (Zod schema)<br>- If valid: save draft → go to step 3<br>- If invalid: show errors | Brak | **Sukces**: Przejście do kroku 3.<br>**Błąd**: Error messages, focus. |
| **Search RCKiK (krok 3)** | - onChange event<br>- Debounce 300ms<br>- Filter RCKiK list locally | Brak (filter local data) | Lista RCKiK przefiltrowana by name/city. |
| **Toggle map view (krok 3)** | - onClick event<br>- Toggle showMap state | Brak | Przełączenie między listą a mapą. |
| **Click checkbox RCKiK (krok 3)** | - onChange event<br>- Toggle ID in selectedIds array<br>- Update form state | Brak | Checkbox toggled, pill added/removed w SelectedFavorites. |
| **Click map marker (krok 3)** | - onClick event (map)<br>- Toggle ID in selectedIds<br>- Update marker color | Brak | Marker color change (grey → blue), pill added/removed. |
| **Click X na pill (krok 3)** | - onClick event<br>- Remove ID from selectedIds<br>- Update form state | Brak | Pill removed, checkbox unchecked, marker grey. |
| **Click "Pomiń" (krok 3)** | - onClick event<br>- Clear favoriteRckikIds<br>- Submit form | `POST /api/v1/auth/register` | Formularz submitted bez favorites, redirect do verify-email-pending. |
| **Click "Wstecz" (krok 3)** | - onClick event<br>- Save draft<br>- Go to step 2 | Brak | Powrót do kroku 2, favorites zachowane. |
| **Click "Zarejestruj się" (krok 3)** | - onClick event<br>- Validate all steps<br>- If valid: disable form, show loading<br>- Submit API | `POST /api/v1/auth/register` | **Sukces**: Clear draft, redirect do `/verify-email-pending` z success message.<br>**Błąd**: Show global error, re-enable form, go back do invalid step. |
| **API error 409 (email exists)** | - Catch error<br>- Show global error<br>- Go back to step 1<br>- Show field error na email | N/A | User wraca do step 1, error: "Ten email jest już zarejestrowany". |
| **API error 400 (validation)** | - Catch error<br>- Parse details<br>- Show field errors<br>- Go to step z błędem | N/A | Field errors displayed, user może poprawić. |
| **Browser back button** | - Page refresh (Astro SSR)<br>- Draft loaded from sessionStorage | Brak | Powrót do formularza z restored fields (draft). |
| **Page refresh/close/reopen** | - Load draft from sessionStorage | Brak | Formularz restored (bez hasła). User może kontynuować. |

## 9. Warunki i walidacja

### 9.1 Warunki API (z backend)

Zgodnie z RegisterRequest.java:

| Pole | Typ | Warunki backend | Walidacja frontend (Zod) |
|------|-----|-----------------|--------------------------|
| `email` | string | Required, valid email, max 255, unique | Required, email format, max 255, unique (async check) |
| `password` | string | Required, min 8, regex pattern | Required, min 8, regex pattern (same as backend) |
| `firstName` | string | Required, max 100 | Required, max 100, only letters |
| `lastName` | string | Required, max 100 | Required, max 100, only letters |
| `bloodGroup` | string | Optional, must be one of 8 values | Optional, enum validation |
| `favoriteRckikIds` | array | Optional, IDs must exist | Optional, array of numbers |
| `consentVersion` | string | Required, max 20 | Hardcoded "1.0" (current version) |
| `consentAccepted` | boolean | Required, must be true | Required, must be true |

### 9.2 Walidacja na poziomie frontend

**Step 1 (Zod schema)**:
```typescript
email: z.string().min(1).email().max(255)
password: z.string().min(8).regex(PASSWORD_REGEX)
confirmPassword: z.string().min(1)
consentAccepted: z.boolean().refine(val => val === true)
// Plus custom refine: password === confirmPassword
// Plus async check: email unique
```

**Step 2 (Zod schema)**:
```typescript
firstName: z.string().min(1).max(100).regex(NAME_REGEX)
lastName: z.string().min(1).max(100).regex(NAME_REGEX)
bloodGroup: z.enum([...]).nullable().optional()
```

**Step 3 (Zod schema)**:
```typescript
favoriteRckikIds: z.array(z.number()).optional().default([])
```

### 9.3 Warunki renderowania UI

**ProgressBar**:
```typescript
// Krok 1: active, kroki 2-3: future
// Po Next z kroku 1: krok 1 completed (✓), krok 2 active
// Po Next z kroku 2: kroki 1-2 completed, krok 3 active
```

**Step1Form - conditional rendering**:
```typescript
{currentStep === 1 && <Step1Form />}
```

**EmailUniquenessCheck indicator**:
```typescript
{emailCheckStatus === 'checking' && <Spinner />}
{emailCheckStatus === 'available' && <CheckIcon />}
{emailCheckStatus === 'taken' && <ErrorIcon />}
```

**PasswordStrength meter**:
```typescript
const strength = calculatePasswordStrength(password);
// strength = 'weak' | 'medium' | 'strong'
// Render bar filled % and color based on strength
```

**PasswordRequirementsChecklist**:
```typescript
const requirements = checkPasswordRequirements(password);
// requirements.minLength: boolean
// requirements.hasUppercase: boolean
// etc.
// Render checkmarks (✓) or X icons per requirement
```

**Step2Form - conditional rendering**:
```typescript
{currentStep === 2 && <Step2Form />}
```

**Step3Form - conditional rendering**:
```typescript
{currentStep === 3 && <Step3Form />}
```

**Map vs List view (step 3)**:
```typescript
{showMap ? <InteractiveMap /> : <RckikCheckboxList />}
```

**SelectedFavorites pills**:
```typescript
{selectedIds.length > 0 && (
  <SelectedFavorites selectedRckiks={...} />
)}
```

**Submit button disabled**:
```typescript
<button disabled={isSubmitting}>
  {isSubmitting ? 'Rejestracja...' : 'Zarejestruj się'}
</button>
```

### 9.4 Warunki biznesowe

**Multi-step navigation**:
- Nie można przejść do kroku 2 bez valid step 1
- Nie można przejść do kroku 3 bez valid step 2
- Można wrócić do poprzednich kroków (Previous button)
- Draft saved on każdej zmianie (debounced)

**Draft persistence**:
- Save wszystkie fields poza hasłem
- Load on mount jeśli exists
- Clear po pomyślnej rejestracji

**Email uniqueness**:
- Check tylko dla valid email format
- Debounce 500ms przed API call
- Cancel previous call jeśli user wpisuje dalej

**Password requirements**:
- Must meet ALL requirements (5 checkmarks) przed next
- Strength indicator informacyjny (nie blokuje)

**Consent**:
- Privacy policy consent REQUIRED (checkbox musi być checked)
- Marketing consent optional

**Blood group**:
- Optional field (może być null)
- Dropdown z opcją "Nie wiem/Wolę nie podawać"

**Favorites**:
- Optional (można pominąć cały krok 3)
- Multi-select (bez limitu w MVP, backend może dodać limit)

## 10. Obsługa błędów

### 10.1 Scenariusze błędów i obsługa

#### 1. Email Already Exists (409 Conflict lub email check)

**Scenariusz**: Email jest już zarejestrowany w systemie.

**Obsługa**:
- Wykryte przez async email check (debounced) → show inline error
- Lub przez API 409 response → show global error + go back to step 1
- Error message: "Ten email jest już zarejestrowany"
- Link do login page: "Masz już konto? Zaloguj się"

**Implementacja**:
```typescript
// Async check
if (emailCheckStatus === 'taken') {
  setErrors({ email: 'Ten email jest już zarejestrowany' });
}

// API 409
if (error.response?.status === 409) {
  setGlobalError('Ten email jest już zarejestrowany');
  setCurrentStep(1);
  setErrors({ email: 'Ten email jest już zarejestrowany' });
}
```

#### 2. Validation Errors (400 Bad Request)

**Scenariusz**: Backend validation fail (weak password, invalid data, etc.).

**Obsługa**:
- Parse error.response.data.details (array of field errors)
- Map to field errors state
- Show errors pod odpowiednimi fields
- Go to step z pierwszym błędem
- Global error: "Sprawdź poprawność danych"

**Implementacja**:
```typescript
if (error.response?.status === 400) {
  const errorData = error.response.data;
  setGlobalError(errorData.message || 'Sprawdź poprawność danych');

  if (errorData.details) {
    const fieldErrors: Record<string, string> = {};
    errorData.details.forEach((detail: any) => {
      fieldErrors[detail.field] = detail.message;
    });
    setErrors(fieldErrors);

    // Go to step with error
    if (fieldErrors.email || fieldErrors.password || fieldErrors.consentAccepted) {
      setCurrentStep(1);
    } else if (fieldErrors.firstName || fieldErrors.lastName || fieldErrors.bloodGroup) {
      setCurrentStep(2);
    }
  }
}
```

#### 3. Password Requirements Not Met (Frontend)

**Scenariusz**: User próbuje przejść dalej z hasłem nie spełniającym requirements.

**Obsługa**:
- Zod validation catch error
- Show error pod password field: "Hasło nie spełnia wymagań złożoności"
- PasswordRequirementsChecklist shows which requirements failed (X icons)
- Prevent navigation do step 2

**Implementacja**:
```typescript
// Zod validation
password: z.string().min(8).regex(PASSWORD_REGEX, 'Hasło nie spełnia wymagań złożoności')

// In component
const requirements = checkPasswordRequirements(password);
const allMet = Object.values(requirements).every(Boolean);
// Disable Next button jeśli !allMet (optional, Zod will catch)
```

#### 4. Passwords Don't Match

**Scenariusz**: confirmPassword !== password.

**Obsługa**:
- Zod refine catch mismatch
- Show error pod confirmPassword field: "Hasła muszą się zgadzać"
- Prevent navigation

**Implementacja**:
```typescript
step1Schema.refine(data => data.password === data.confirmPassword, {
  message: 'Hasła muszą się zgadzać',
  path: ['confirmPassword'],
});
```

#### 5. Consent Not Accepted

**Scenariusz**: User nie zaznaczył required consent checkbox.

**Obsługa**:
- Zod validation catch
- Show error: "Musisz zaakceptować politykę prywatności"
- Highlight checkbox border (red)
- Prevent navigation

**Implementacja**:
```typescript
consentAccepted: z.boolean().refine(val => val === true, 'Musisz zaakceptować politykę prywatności')
```

#### 6. Invalid Name (Special Characters)

**Scenariusz**: firstName/lastName zawiera cyfry lub special chars.

**Obsługa**:
- Zod regex validation catch
- Show error: "Imię/Nazwisko może zawierać tylko litery"
- Prevent navigation do step 3

**Implementacja**:
```typescript
firstName: z.string().regex(NAME_REGEX, 'Imię może zawierać tylko litery')
```

#### 7. Rate Limit (429 Too Many Requests)

**Scenariusz**: Zbyt wiele prób rejestracji (backend rate limit).

**Obsługa**:
- Catch 429 status
- Show global error: "Zbyt wiele prób rejestracji. Spróbuj ponownie później."
- Disable submit button na X sekund (optional)
- Suggest login: "Masz już konto? Zaloguj się"

**Implementacja**:
```typescript
if (error.response?.status === 429) {
  setGlobalError('Zbyt wiele prób rejestracji. Spróbuj ponownie później.');
  // Optional: extract Retry-After header
}
```

#### 8. Network Error

**Scenariusz**: Brak internetu, API unavailable.

**Obsługa**:
- Catch error bez response
- Show global error: "Problem z połączeniem. Sprawdź internet."
- Retry button (optional)

**Implementacja**:
```typescript
if (!error.response) {
  setGlobalError('Problem z połączeniem. Sprawdź swoje połączenie internetowe.');
}
```

#### 9. Server Error (500)

**Scenariusz**: Backend crash, database down.

**Obsługa**:
- Catch 500 status
- Show global error: "Wystąpił błąd serwera. Spróbuj ponownie później."
- Log to Sentry (optional)
- Retry button

**Implementacja**:
```typescript
if (error.response?.status === 500) {
  setGlobalError('Wystąpił błąd serwera. Spróbuj ponownie później.');
  // Sentry.captureException(error);
}
```

#### 10. Email Check API Fails

**Scenariusz**: Async email uniqueness check fails (network, timeout).

**Obsługa**:
- Catch error w checkEmail
- Set emailCheckStatus = 'error'
- Log warning (console)
- Nie blokuj procesu (user może kontynuować, backend zwaliduje)
- Show warning (optional): "Nie udało się sprawdzić emaila"

**Implementacja**:
```typescript
try {
  const isUnique = await checkEmailUniqueness(email);
  // ...
} catch (error) {
  setEmailCheckStatus('error');
  console.warn('Email check failed:', error);
  // Don't block user, backend will validate
}
```

#### 11. SessionStorage Unavailable

**Scenariusz**: SessionStorage disabled (private mode) lub quota exceeded.

**Obsługa**:
- Catch error w saveRegistrationDraft
- Log warning
- Continue bez draft persistence (in-memory only)
- Show optional toast: "Nie udało się zapisać draftu"

**Implementacja**:
```typescript
export function saveRegistrationDraft(formData: RegisterFormData): void {
  try {
    sessionStorage.setItem(REGISTER_DRAFT_KEY, JSON.stringify(draftData));
  } catch (error) {
    console.warn('Failed to save registration draft:', error);
    // Optional: show toast
  }
}
```

#### 12. Favorite RCKiK IDs Invalid (Backend)

**Scenariusz**: User podał ID które nie istnieje (manipulated request).

**Obsługa**:
- Backend zwraca 400 z details
- Frontend parse error details
- Show error w step 3: "Wybrane centrum nie istnieje"
- Go back to step 3

**Implementacja**:
```typescript
if (fieldErrors.favoriteRckikIds) {
  setCurrentStep(3);
  setErrors({ favoriteRckikIds: 'Wybrane centrum nie istnieje' });
}
```

### 10.2 Error Boundaries (React)

Dla RegisterForm (React island), użyj ErrorBoundary:

```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <RegisterForm />
</ErrorBoundary>
```

### 10.3 Accessibility dla błędów

**ARIA live regions**:
```tsx
<div role="alert" aria-live="assertive">
  {globalError && <p>{globalError}</p>}
</div>
```

**Error messages powiązane z fields**:
```tsx
<input
  id="email"
  aria-describedby={errors.email ? 'email-error' : undefined}
  aria-invalid={!!errors.email}
/>
{errors.email && (
  <span id="email-error" role="alert">
    {errors.email}
  </span>
)}
```

**Focus management**:
- Po błędzie submitu → focus na pierwszy field z błędem
- Lub focus na global error message

## 11. Kroki implementacji

### Faza 1: Setup i typy (1 dzień)

#### Krok 1: Struktura katalogów

```bash
src/
├── components/
│   ├── auth/
│   │   ├── RegisterForm.tsx
│   │   ├── ProgressBar.tsx
│   │   └── register/
│   │       ├── Step1Form.tsx
│   │       ├── Step2Form.tsx
│   │       ├── Step3Form.tsx
│   │       ├── EmailUniquenessCheck.tsx
│   │       ├── PasswordStrength.tsx
│   │       ├── PasswordRequirementsChecklist.tsx
│   │       ├── BloodGroupSelect.tsx
│   │       ├── FavoritesPicker.tsx
│   │       ├── RckikCheckboxList.tsx
│   │       ├── RckikCheckboxItem.tsx
│   │       └── SelectedFavorites.tsx
│   ├── common/
│   │   └── InteractiveMap.tsx
│   └── forms/
│       └── (reuse from login: EmailInput, PasswordInput, etc.)
├── types/
│   └── auth.ts (extend for registration types)
├── lib/
│   ├── api/
│   │   └── endpoints/
│   │       └── auth.ts (add registerUser, checkEmailUniqueness)
│   └── hooks/
│       ├── useRegisterForm.ts
│       └── useDebounce.ts (reuse)
└── pages/
    └── register.astro
```

#### Krok 2: Definiowanie typów

Rozszerz `src/types/auth.ts` o typy rejestracji (patrz sekcja 5):
- RegisterRequest, RegisterResponse
- RegisterFormData, Step1/2/3FormData
- BloodGroup, BLOOD_GROUPS
- Zod schemas (step1Schema, step2Schema, step3Schema)
- PasswordRequirements, PasswordStrength
- RckikBasic, EmailCheckStatus
- Wszystkie component props
- Utility functions (calculatePasswordStrength, checkPasswordRequirements, draft management)

#### Krok 3: API endpoints

Rozszerz `src/lib/api/endpoints/auth.ts`:
```typescript
export async function registerUser(data: RegisterRequest): Promise<RegisterResponse>
export async function checkEmailUniqueness(email: string): Promise<boolean>
```

### Faza 2: Custom hooks (1 dzień)

#### Krok 4: useRegisterForm hook

Utwórz `src/lib/hooks/useRegisterForm.ts` (patrz sekcja 6.2):
- State management (formData, currentStep, errors, isSubmitting)
- Navigation (goToNextStep, goToPreviousStep, skipStep3)
- Validation per step (validateStep)
- Email uniqueness check (useEffect + debounce)
- Draft persistence (save/load from sessionStorage)
- handleSubmit (final API call)

Test hook:
- Step navigation works
- Validation blocks invalid steps
- Draft saves/loads correctly (without password)
- Email check debounces properly

### Faza 3: ProgressBar i navigation (0.5 dnia)

#### Krok 5: ProgressBar component

Utwórz `src/components/auth/ProgressBar.tsx`:
- Visual steps (1/3, 2/3, 3/3)
- Active step highlighted
- Completed steps with checkmark
- Progress bar filled % (33%, 66%, 100%)
- Accessibility: nav, aria-label

### Faza 4: Step 1 components (2 dni)

#### Krok 6: EmailUniquenessCheck component

Utwórz `src/components/auth/register/EmailUniquenessCheck.tsx`:
- Async API call (debounced w parent hook)
- Loading spinner
- Checkmark (available) / Error icon (taken)
- Props: email, onResult

Test:
- Debounce works (500ms)
- Shows loading during check
- Shows correct icon based on result

#### Krok 7: PasswordStrength component

Utwórz `src/components/auth/register/PasswordStrength.tsx`:
- Calculate strength (weak/medium/strong)
- Visual bar (filled %, color coded)
- Label text
- Props: password

Test:
- "password123" → weak (red)
- "Password123!" → medium (yellow)
- "MySecureP@ssw0rd!" → strong (green)

#### Krok 8: PasswordRequirementsChecklist component

Utwórz `src/components/auth/register/PasswordRequirementsChecklist.tsx`:
- 5 requirements (min length, uppercase, lowercase, digit, special)
- Check/X icon per requirement
- Live update podczas wpisywania
- Props: password

#### Krok 9: Step1Form component

Utwórz `src/components/auth/register/Step1Form.tsx`:
- EmailInput (reuse z login)
- EmailUniquenessCheck
- PasswordInput (reuse)
- PasswordStrength
- PasswordRequirementsChecklist
- ConfirmPasswordInput (reuse PasswordInput)
- ConsentCheckboxes
- Next button

Test:
- All validations work
- Email check integration
- Password strength updates live
- Requirements checklist accurate
- Consent required

### Faza 5: Step 2 components (1 dzień)

#### Krok 10: BloodGroupSelect component

Utwórz `src/components/auth/register/BloodGroupSelect.tsx`:
- Dropdown/Select z 8 opcjami + "Nie wiem"
- Optional field (może być null)
- Props: value, onChange, error

#### Krok 11: Step2Form component

Utwórz `src/components/auth/register/Step2Form.tsx`:
- FirstNameInput (reuse Input component)
- LastNameInput
- BloodGroupSelect
- Previous button
- Next button

Test:
- Name validation (only letters)
- Blood group optional
- Navigation (Previous/Next)

### Faza 6: Step 3 components (2-3 dni)

#### Krok 12: RckikCheckboxItem component

Utwórz `src/components/auth/register/RckikCheckboxItem.tsx`:
- Checkbox + label
- RCKiK name + city
- Props: rckik, checked, onChange

#### Krok 13: RckikCheckboxList component

Utwórz `src/components/auth/register/RckikCheckboxList.tsx`:
- Lista RckikCheckboxItem × N
- Props: items, selectedIds, onToggle

#### Krok 14: SelectedFavorites component

Utwórz `src/components/auth/register/SelectedFavorites.tsx`:
- Pills dla selected RCKiK
- Remove button (X) na każdym pill
- Props: selectedRckiks, onRemove

#### Krok 15: InteractiveMap component (optional)

Utwórz `src/components/common/InteractiveMap.tsx`:
- Leaflet/Mapbox integration
- Markers dla RCKiK
- Click marker → toggle selected
- Color coding (grey/blue)
- Props: rckikList, selectedIds, onToggle

Setup Leaflet:
```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

#### Krok 16: FavoritesPicker component

Utwórz `src/components/auth/register/FavoritesPicker.tsx`:
- SearchInput (filter RCKiK)
- Toggle map/list button (optional)
- Conditional: InteractiveMap || RckikCheckboxList
- SelectedFavorites
- Count indicator
- Props: selectedIds, onChange, rckikList

#### Krok 17: Step3Form component

Utwórz `src/components/auth/register/Step3Form.tsx`:
- FavoritesPicker
- Skip button
- Previous button
- Submit button (with loading)

Test:
- Search filters correctly
- Multi-select works (checkbox + map)
- Pills update on selection
- Remove works
- Skip clears favorites

### Faza 7: RegisterForm integration (1 dzień)

#### Krok 18: RegisterForm container

Utwórz `src/components/auth/RegisterForm.tsx`:
- Use useRegisterForm hook
- Conditional rendering per step
- Global error message
- Wrap w ErrorBoundary

Struktura:
```tsx
export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const {
    formData,
    currentStep,
    completedSteps,
    errors,
    isSubmitting,
    globalError,
    emailCheckStatus,
    isEmailUnique,
    updateField,
    goToNextStep,
    goToPreviousStep,
    skipStep3,
    handleSubmit,
  } = useRegisterForm();

  return (
    <form>
      {globalError && <ErrorMessage message={globalError} />}

      {currentStep === 1 && (
        <Step1Form
          formData={formData}
          errors={errors}
          onChange={updateField}
          onNext={goToNextStep}
        />
      )}

      {currentStep === 2 && (
        <Step2Form
          formData={formData}
          errors={errors}
          onChange={updateField}
          onPrevious={goToPreviousStep}
          onNext={goToNextStep}
        />
      )}

      {currentStep === 3 && (
        <Step3Form
          formData={formData}
          onChange={updateField}
          onPrevious={goToPreviousStep}
          onSkip={skipStep3}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </form>
  );
}
```

### Faza 8: Astro page (0.5 dnia)

#### Krok 19: register.astro page

Utwórz `src/pages/register.astro`:

```astro
---
import AuthLayout from '@/layouts/AuthLayout.astro';
import SEO from '@/components/SEO.astro';
import RegisterForm from '@/components/auth/RegisterForm';
import ProgressBar from '@/components/auth/ProgressBar';

// Middleware sprawdza czy już zalogowany
export const prerender = false; // SSR
---

<AuthLayout>
  <SEO
    slot="head"
    title="Zarejestruj się | mkrew"
    description="Dołącz do społeczności dawców krwi. Monitoruj stany zapasów i otrzymuj powiadomienia."
    noindex={true}
  />

  <main class="container mx-auto px-4 py-8 max-w-2xl">
    <header class="mb-8 text-center">
      <h1 class="text-3xl font-bold mb-2">Zarejestruj się</h1>
      <p class="text-gray-600">Dołącz do społeczności dawców krwi</p>
    </header>

    <div class="mb-8">
      <ProgressBar client:load currentStep={1} completedSteps={[]} />
    </div>

    <div class="bg-white shadow-md rounded-lg p-8">
      <RegisterForm client:load />
    </div>

    <div class="mt-6 text-center text-sm text-gray-600">
      Masz już konto?{' '}
      <a href="/login" class="text-blue-600 hover:underline font-semibold">
        Zaloguj się
      </a>
    </div>
  </main>
</AuthLayout>
```

### Faza 9: Stylowanie (1 dzień)

#### Krok 20: Tailwind CSS styling

Style dla wszystkich komponentów:
- ProgressBar: steps z numerami/checkmarks, filled bar
- Step forms: card styling, spacing
- PasswordStrength: colored bar (red/yellow/green)
- PasswordRequirementsChecklist: checkmarks/X icons
- BloodGroupSelect: dropdown styling
- FavoritesPicker: search input, map/list toggle
- Pills (SelectedFavorites): badge styling z X button
- Buttons: Next (blue), Previous (grey), Skip (text-only), Submit (blue)

#### Krok 21: Responsive design

- Mobile (<768px):
  - Single column layout
  - Smaller padding
  - Map full width (if shown)
  - Pills wrap

- Desktop (>768px):
  - Max width 2xl centered
  - Larger spacing
  - Map side-by-side with list (optional)

### Faza 10: Testowanie (2 dni)

#### Krok 22: Unit tests

Vitest + RTL.

Tests:
- `calculatePasswordStrength.test.ts`: weak/medium/strong cases
- `checkPasswordRequirements.test.ts`: all 5 requirements
- `PasswordStrength.test.tsx`: renders correct strength
- `PasswordRequirementsChecklist.test.tsx`: checkmarks update
- `useRegisterForm.test.ts`: step navigation, validation, draft persistence

```typescript
// Example: useRegisterForm.test.ts
import { renderHook, act } from '@testing-library/react';
import { useRegisterForm } from './useRegisterForm';

describe('useRegisterForm', () => {
  it('starts at step 1', () => {
    const { result } = renderHook(() => useRegisterForm());
    expect(result.current.currentStep).toBe(1);
  });

  it('validates step 1 before proceeding', () => {
    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.goToNextStep();
    });

    // Should not proceed (validation fails)
    expect(result.current.currentStep).toBe(1);
    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);
  });

  it('saves draft to sessionStorage', () => {
    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.updateField('firstName', 'Jan');
    });

    // Wait for debounce
    setTimeout(() => {
      const draft = sessionStorage.getItem('register_draft');
      expect(draft).toBeTruthy();
      expect(JSON.parse(draft!).firstName).toBe('Jan');
    }, 1500);
  });
});
```

#### Krok 23: Integration tests

MSW dla mock API.

Test flows:
- Valid registration (all 3 steps) → success → redirect
- Email already exists → error on step 1
- Invalid password → validation errors
- Skip step 3 → submit without favorites

```typescript
// Example: RegisterForm.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { RegisterForm } from './RegisterForm';

const server = setupServer(
  rest.get('/api/v1/auth/check-email', (req, res, ctx) => {
    const email = req.url.searchParams.get('email');
    return res(ctx.json({ available: email !== 'taken@example.com' }));
  }),
  rest.post('/api/v1/auth/register', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({
      userId: 123,
      email: 'test@example.com',
      emailVerified: false,
      message: 'Registration successful'
    }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('complete registration flow', async () => {
  render(<RegisterForm />);

  // Step 1
  await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
  await waitFor(() => {
    expect(screen.getByText(/email dostępny/i)).toBeInTheDocument();
  }, { timeout: 1000 });

  await userEvent.type(screen.getByLabelText('Hasło'), 'SecurePass123!');
  await userEvent.type(screen.getByLabelText('Potwierdź hasło'), 'SecurePass123!');
  await userEvent.click(screen.getByLabelText(/akceptuję politykę/i));
  await userEvent.click(screen.getByRole('button', { name: /dalej/i }));

  // Step 2
  await waitFor(() => {
    expect(screen.getByLabelText('Imię')).toBeInTheDocument();
  });

  await userEvent.type(screen.getByLabelText('Imię'), 'Jan');
  await userEvent.type(screen.getByLabelText('Nazwisko'), 'Kowalski');
  await userEvent.click(screen.getByRole('button', { name: /dalej/i }));

  // Step 3
  await waitFor(() => {
    expect(screen.getByText(/wybierz ulubione/i)).toBeInTheDocument();
  });

  await userEvent.click(screen.getByRole('button', { name: /zarejestruj/i }));

  await waitFor(() => {
    // Should redirect (mock router)
    expect(mockRouter.push).toHaveBeenCalledWith('/verify-email-pending');
  });
});
```

#### Krok 24: E2E tests

Playwright.

Test scenarios:
- Complete 3-step registration
- Email already exists
- Weak password rejected
- Draft persistence (refresh page, data restored)
- Map interaction (if implemented)

```typescript
// Example: register.spec.ts
import { test, expect } from '@playwright/test';

test('user can complete registration', async ({ page }) => {
  await page.goto('/register');

  // Step 1
  await page.fill('input[type="email"]', 'newuser@example.com');
  await page.fill('input[type="password"]', 'SecurePass123!');
  await page.fill('input[name="confirmPassword"]', 'SecurePass123!');
  await page.check('input[name="consentAccepted"]');
  await page.click('button:has-text("Dalej")');

  // Step 2
  await page.fill('input[name="firstName"]', 'Jan');
  await page.fill('input[name="lastName"]', 'Kowalski');
  await page.click('button:has-text("Dalej")');

  // Step 3
  await page.click('button:has-text("Zarejestruj się")');

  await expect(page).toHaveURL('/verify-email-pending');
});

test('draft is restored after refresh', async ({ page }) => {
  await page.goto('/register');

  // Fill some fields
  await page.fill('input[type="email"]', 'draft@example.com');
  await page.fill('input[name="firstName"]', 'Jan');

  // Refresh page
  await page.reload();

  // Fields should be restored (except password)
  await expect(page.locator('input[type="email"]')).toHaveValue('draft@example.com');
  // Password should be empty (not stored)
  await expect(page.locator('input[type="password"]')).toHaveValue('');
});
```

### Faza 11: Accessibility i dokumentacja (1 dzień)

#### Krok 25: Accessibility audit

- ARIA labels, roles
- Keyboard navigation (Tab przez wszystkie fields)
- Screen reader testing
- Progress bar with aria-label
- Error messages z aria-live
- axe DevTools audit

#### Krok 26: Dokumentacja

JSDoc komentarze dla wszystkich komponentów i hooks.

#### Krok 27: Deploy

- Build, test na staging
- Smoke test registration flow
- Deploy to production

---

## Podsumowanie timeline

- **Faza 1**: Setup i typy (1 dzień)
- **Faza 2**: Custom hooks (1 dzień)
- **Faza 3**: ProgressBar (0.5 dnia)
- **Faza 4**: Step 1 components (2 dni)
- **Faza 5**: Step 2 components (1 dzień)
- **Faza 6**: Step 3 components (2-3 dni)
- **Faza 7**: RegisterForm integration (1 dzień)
- **Faza 8**: Astro page (0.5 dnia)
- **Faza 9**: Stylowanie (1 dzień)
- **Faza 10**: Testowanie (2 dni)
- **Faza 11**: Accessibility + Dokumentacja (1 dzień)

**Całkowity szacowany czas: 13-14 dni roboczych** (2.5-3 tygodnie dla jednego dewelopera)

---

## Dodatkowe uwagi

### Security Best Practices

1. **Password nie w draft**: NIGDY nie zapisuj hasła w sessionStorage
2. **Email uniqueness**: Backend też musi walidować (frontend może być bypassed)
3. **Rate limiting**: Backend enforce limit prób rejestracji
4. **HTTPS**: Enforce w production
5. **Input sanitization**: Zod validation + backend validation

### UX Best Practices

1. **Progress indicator**: User zawsze wie gdzie jest (krok X/3)
2. **Draft persistence**: User nie traci danych po refresh (poza hasłem)
3. **Inline validation**: Błędy pokazane natychmiast, nie po submit
4. **Password strength**: Visual feedback pomaga user stworzyć silne hasło
5. **Optional steps**: Step 3 można pominąć (nie force wyboru favorites)
6. **Navigation**: Previous button pozwala wrócić i poprawić
7. **Clear errors**: Errors znikają gdy user poprawia pole

### Future Enhancements

1. **Social registration**: Google, Facebook OAuth
2. **Email suggestions**: "Czy chodziło Ci o gmail.com?" (typo detection)
3. **Password strength meter advanced**: zxcvbn library
4. **Map clustering**: Dla dużej liczby RCKiK
5. **Autocomplete**: Address autocomplete dla favorites search
6. **Progressive disclosure**: Show step 2/3 preview (collapsed)
7. **Analytics**: Track gdzie users drop off (step 1 vs 2 vs 3)
