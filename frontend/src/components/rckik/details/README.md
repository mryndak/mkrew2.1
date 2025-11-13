# RCKiK Details Components

This directory contains all React components for the RCKiK Details View (`/rckik/[id]`).

## Components Overview

### Core Components

#### 1. RckikHeader.tsx
**Purpose**: Main header displaying center information and actions

**Props**:
- `rckik: RckikDetailDto` - Center details
- `isFavorite: boolean` - Favorite state
- `isAuthenticated: boolean` - Auth state
- `onToggleFavorite: () => void` - Toggle handler

**Features**:
- Center name with active/inactive badge
- Full address with Google Maps link
- Coordinates display (lat/long)
- Favorite button (heart icon)
- Aliases list (if available)
- Responsive layout (mobile/tablet/desktop)

**Accessibility**:
- Semantic `<header>` element
- Proper heading hierarchy (h1)
- ARIA labels on buttons
- Keyboard navigation support

---

#### 2. BloodLevelChart.tsx
**Purpose**: Interactive line chart showing blood level trends

**Props**:
- `rckikId: number` - Center ID
- `initialBloodGroup?: BloodGroup` - Initial selected group (default: "0+")
- `historyData: BloodLevelHistoryDto[]` - Historical snapshots
- `onBloodGroupChange?: (group: BloodGroup) => void` - Selection callback

**Features**:
- Blood group selector (8 buttons)
- Line chart (Recharts) with last 30 days data
- Reference lines (20% critical, 50% important)
- Custom tooltip with formatted data
- Loading/error/empty states
- Responsive chart height (h-64 sm:h-80)

**Dependencies**:
- `recharts` - Chart library
- `BloodGroupSelector` - Filter component
- `useBloodLevelHistory` - Data fetching hook

**Performance**:
- Limits data to 100 points
- Memoizes chart data transformation
- Lazy loads when visible (`client:visible`)

---

#### 3. BloodGroupSelector.tsx
**Purpose**: Selector for choosing blood group in chart

**Props**:
- `selectedBloodGroup: BloodGroup` - Currently selected group
- `availableGroups: BloodGroup[]` - Groups with data
- `currentLevels?: BloodLevelDto[]` - Current levels for tooltips
- `onChange: (group: BloodGroup) => void` - Selection callback

**Features**:
- 8 blood group buttons (0+, 0-, A+, A-, B+, B-, AB+, AB-)
- Active state styling (blue background)
- Disabled state for unavailable groups
- Tooltips with current level and status
- Status indicator dots (red/orange/green)
- Keyboard navigation (Tab, Enter, Space)

**Variants**:
- `BloodGroupSelector` - Full version with labels
- `CompactBloodGroupSelector` - Icon-only version

**Accessibility**:
- `role="radiogroup"` for semantic structure
- `aria-labelledby` for group label
- `aria-checked` for current selection
- `aria-label` on each button

---

#### 4. HistoryTable.tsx
**Purpose**: Paginated table with historical snapshots

**Props**:
- `rckikId: number` - Center ID
- `initialPage?: number` - Starting page (default: 0)
- `initialPageSize?: number` - Page size (default: 20)
- `initialFilters?: HistoryTableFilters` - Initial filters

**Features**:
- **Columns**: Date, Blood Group, Level %, Status, Scraped At, Source
- **Filters**: Blood group dropdown, Date range (from/to)
- **Sorting**: Client-side by date/blood group/percentage
- **Pagination**: Configurable size, first/prev/next/last buttons
- **States**: Loading skeleton, error with retry, empty with reset

**Data Flow**:
```
useBloodLevelHistory hook
  ↓ (snapshots + pagination)
Client-side sorting (useMemo)
  ↓ (sortedSnapshots)
Table rendering
```

**Dependencies**:
- `useBloodLevelHistory` - Data fetching
- `Pagination` - Pagination controls
- `Badge` - Status display
- `Select` / `Input` - Filter inputs
- `Button` - Clear filters

**Performance**:
- Memoizes sorted data
- Resets to page 0 when filters change
- Responsive table (horizontal scroll on mobile)

---

#### 5. ScraperStatus.tsx
**Purpose**: Displays scraper status and data freshness

**Props**:
- `lastSuccessfulScrape: string` - Timestamp (ISO format)
- `scrapingStatus: 'OK' | 'DEGRADED' | 'FAILED' | 'UNKNOWN'` - Status
- `errorMessage?: string` - Optional error details

**Features**:
- Status badge with icon (check/warning/error/question)
- Last successful scrape timestamp (formatted: "15 stycznia 2025, 10:00")
- Relative time ("2 godziny temu")
- Status-specific messages:
  - **OK**: "Dane są aktualne"
  - **DEGRADED**: "Dane mogą być częściowo nieaktualne"
  - **FAILED**: "Błąd pobierania danych"
  - **UNKNOWN**: "Status nieznany"
- Link to report data issues (US-021)

**Time Calculations**:
- Days: "> 24 hours ago"
- Hours: "< 24 hours ago"
- Minutes: "< 1 hour ago"

---

#### 6. FavoriteButton.tsx
**Purpose**: Standalone button for favorite management

**Props**:
- `rckikId: number` - Center ID
- `initialIsFavorite: boolean` - Initial state
- `isAuthenticated: boolean` - Auth state
- `onAuthRequired?: () => void` - Auth redirect callback

**Features**:
- Heart icon (filled when favorite, outline when not)
- Loading spinner during API call
- Optimistic updates (immediate UI feedback)
- Rollback on error
- Toast notifications (success/error)
- Login redirect for unauthenticated users

**States**:
- Default: Outline heart, "Dodaj do ulubionych"
- Favorite: Filled heart, red background, "Usuń z ulubionych"
- Loading: Spinner, disabled
- Unauthenticated: Outline heart, "Zaloguj się, aby dodać do ulubionych"

**Variants**:
- `FavoriteButton` - Full button with text
- `CompactFavoriteButton` - Icon-only, rounded

**Dependencies**:
- `useFavoriteToggle` - State management hook

---

#### 7. RckikNotFound.astro
**Purpose**: 404 error page for non-existent centers

**Props**:
- `rckikId?: number | string` - Optional ID for display

**Features**:
- Friendly 404 message with sad face icon
- RCKiK ID display (if provided)
- Two action buttons:
  - "Przeglądaj wszystkie centra" → `/rckik`
  - "Wróć do strony głównej" → `/`
- Contact link for reporting errors

**When Shown**:
- Invalid ID format (non-integer, negative)
- Non-existent center (not in database)
- Deleted/archived center

---

## Testing

### Component Tests
Located in `__tests__/` subdirectories

**Covered**:
- ✅ RckikHeader (full coverage)
- 🔄 BloodLevelChart (to be added)
- 🔄 BloodGroupSelector (to be added)
- 🔄 HistoryTable (to be added)
- 🔄 ScraperStatus (to be added)
- 🔄 FavoriteButton (to be added)

**Test Setup**:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm test
```

See [TESTING.md](../../../TESTING.md) for details.

---

## Performance

### Optimizations

#### 1. Memoization
**BloodLevelBadge** (parent component):
```typescript
export const BloodLevelBadge = memo(BloodLevelBadgeComponent, customComparison);
```

#### 2. Hydration Strategies
```astro
<!-- Critical - immediate -->
<RckikHeader client:load />

<!-- Below fold - lazy load -->
<BloodLevelChart client:visible />

<!-- Heavy - defer -->
<HistoryTable client:idle />
```

#### 3. Data Fetching
- 5-minute cache in Redux
- Debounced filter inputs
- Paginated API calls

See [PERFORMANCE.md](../../../PERFORMANCE.md) for metrics.

---

## Styling

### Tailwind CSS Classes

**Common Patterns**:
```typescript
// Container
"bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6"

// Heading
"text-xl sm:text-2xl font-semibold text-gray-900 mb-4"

// Button (Primary)
"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"

// Button (Outline)
"px-4 py-2 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50"

// Grid (Responsive)
"grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
```

### Responsive Breakpoints
- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (sm to lg)
- **Desktop**: > 1024px (lg+)

---

## Dependencies

### npm Packages
```json
{
  "recharts": "^3.4.1",        // Charts
  "@reduxjs/toolkit": "^2.10.1", // State management
  "react": "^19.2.0",          // UI framework
  "react-redux": "^9.2.0",     // Redux bindings
  "axios": "^1.13.2"           // HTTP client
}
```

### Internal Dependencies
- `@/components/ui/Badge` - Status indicators
- `@/components/ui/Tooltip` - Hover tooltips
- `@/components/ui/Button` - Action buttons
- `@/components/ui/Select` - Dropdowns
- `@/components/ui/Input` - Form inputs
- `@/components/rckik/Pagination` - Table pagination
- `@/components/common/ErrorState` - Error UI
- `@/components/common/EmptyState` - Empty UI

---

## Usage Examples

### 1. Basic Page Setup
```astro
---
// src/pages/rckik/[id].astro
import { RckikHeader } from '@/components/rckik/details/RckikHeader';
import { BloodLevelChart } from '@/components/rckik/details/BloodLevelChart';

const rckik = await fetchRckikDetails(rckikId);
---

<RckikHeader rckik={rckik} client:load />
<BloodLevelChart rckikId={rckikId} client:visible />
```

### 2. Handling Favorites
```typescript
const handleToggleFavorite = () => {
  if (!isAuthenticated) {
    router.push(`/login?returnUrl=/rckik/${rckikId}`);
    return;
  }
  // Toggle logic handled by useFavoriteToggle
};

<RckikHeader
  rckik={rckik}
  isFavorite={isFavorite}
  isAuthenticated={isAuthenticated}
  onToggleFavorite={handleToggleFavorite}
/>
```

### 3. Custom Blood Group Selection
```typescript
const [selectedGroup, setSelectedGroup] = useState<BloodGroup>('A+');

<BloodGroupSelector
  selectedBloodGroup={selectedGroup}
  availableGroups={['0+', 'A+', 'B+', 'AB+']}
  currentLevels={rckik.currentBloodLevels}
  onChange={(group) => {
    setSelectedGroup(group);
    // Update chart, table, etc.
  }}
/>
```

---

## Troubleshooting

### Issue: Chart not rendering
**Symptom**: Empty white box where chart should be

**Causes**:
1. No data available
2. Invalid data format
3. Missing recharts dependency

**Solutions**:
1. Check `historyData` prop has valid snapshots
2. Verify `BloodLevelHistoryDto` type matches
3. Run `npm install recharts`

---

### Issue: Table sorting broken
**Symptom**: Clicking sort headers does nothing

**Cause**: API already returns sorted data

**Solution**: Disable client-side sorting when using API sorting
```typescript
// Remove this if API handles sorting:
const sortedSnapshots = useMemo(() => { ... }, []);
```

---

### Issue: Favorites not saving
**Symptom**: Heart icon toggles but doesn't persist

**Causes**:
1. User not authenticated
2. API error (check network tab)
3. Redux state not syncing

**Solutions**:
1. Check `isAuthenticated` prop
2. Look for 401/403 errors in console
3. Verify Redux DevTools shows state updates

---

## Best Practices

### 1. Error Handling
```typescript
// Always handle loading/error/empty states
if (loading) return <Skeleton />;
if (error) return <ErrorState error={error} onRetry={refetch} />;
if (!data || data.length === 0) return <EmptyState />;
```

### 2. Accessibility
```typescript
// Use semantic HTML
<header>
  <h1>Center Name</h1>
  <button aria-label="Add to favorites">❤️</button>
</header>

// Add ARIA labels
<div role="status" aria-live="polite">
  Loading...
</div>
```

### 3. Performance
```typescript
// Memoize expensive computations
const chartData = useMemo(() =>
  transformData(snapshots),
  [snapshots]
);

// Use useCallback for handlers
const handleSort = useCallback((column) => {
  setSort(column);
}, []);
```

---

## Migration Checklist

When replacing mock data with real API:

- [ ] Update `fetchRckikDetails` in `[id].astro`
- [ ] Remove mock `historyData` generation
- [ ] Update `getStaticPaths` to fetch real IDs
- [ ] Handle 404 responses properly
- [ ] Test with production API
- [ ] Verify pagination works
- [ ] Check sorting and filtering
- [ ] Test favorite toggle with auth
- [ ] Validate error handling

---

## Additional Resources

- [Main Documentation](../../../RCKIK_DETAILS_VIEW.md)
- [Performance Guide](../../../PERFORMANCE.md)
- [Testing Guide](../../../TESTING.md)
- [API Documentation](../../../lib/api/README.md)

---

**Maintained by**: Frontend Team
**Last Updated**: January 2025
**Version**: 2.1.0
