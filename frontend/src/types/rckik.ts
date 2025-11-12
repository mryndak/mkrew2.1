// ===== API Response Types (mapowane z backendu) =====

/**
 * Response z API dla listy RCKiK (paginowany)
 * Endpoint: GET /api/v1/rckik
 */
export interface RckikListApiResponse {
  content: RckikSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/**
 * Podsumowanie pojedynczego centrum RCKiK
 * Używane w liście centrów
 */
export interface RckikSummary {
  id: number;
  name: string;
  code: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
  bloodLevels: BloodLevel[];
  dataStatus: DataStatus;
  lastUpdate: string; // ISO 8601 timestamp
}

/**
 * Poziom krwi dla konkretnej grupy
 */
export interface BloodLevel {
  bloodGroup: BloodGroup;
  levelPercentage: number; // 0.00 - 100.00
  levelStatus: BloodLevelStatus;
  lastUpdate: string; // ISO 8601 timestamp
}

// ===== Enums and Literals =====

/**
 * Grupy krwi (8 typów)
 */
export type BloodGroup = '0+' | '0-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';

/**
 * Status poziomu krwi
 * - CRITICAL: < 20%
 * - IMPORTANT: 20-49%
 * - OK: >= 50%
 */
export type BloodLevelStatus = 'CRITICAL' | 'IMPORTANT' | 'OK';

/**
 * Status kompletności danych (US-020)
 * - OK: Dane kompletne
 * - PARTIAL: Dane częściowe (niektóre grupy krwi brakujące)
 * - NO_DATA: Brak danych
 */
export type DataStatus = 'OK' | 'PARTIAL' | 'NO_DATA';

// ===== UI State Types =====

/**
 * Filtry dla listy RCKiK
 */
export interface RckikFilters {
  city: string | null; // null = wszystkie miasta
  active: boolean; // pokazuj tylko aktywne centra
  sortBy: 'name' | 'city' | 'code';
  sortOrder: 'ASC' | 'DESC';
}

/**
 * Parametry wyszukiwania (filtry + paginacja + search)
 * Synchronizowane z URL query params
 */
export interface RckikSearchParams extends RckikFilters {
  page: number; // zero-based
  size: number; // 10, 20, 50, 100
  search: string; // wyszukiwanie po nazwie
}

/**
 * Stan hooka useRckikList
 */
export interface RckikListState {
  data: RckikListApiResponse | null;
  loading: boolean;
  error: Error | null;
  params: RckikSearchParams;
}

// ===== Component Props Types =====

/**
 * Props dla RckikCard component
 */
export interface RckikCardProps {
  rckik: RckikSummary;
}

/**
 * Props dla BloodLevelBadge component
 */
export interface BloodLevelBadgeProps {
  bloodLevel: BloodLevel;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Props dla DataStatusBadge component
 */
export interface DataStatusBadgeProps {
  dataStatus: DataStatus;
  lastUpdate?: string;
}

/**
 * Props dla FiltersPanel component
 */
export interface FiltersPanelProps {
  initialFilters: RckikFilters;
  availableCities: string[];
  onFiltersChange: (filters: RckikFilters) => void;
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Props dla CityFilter component
 */
export interface CityFilterProps {
  value: string | null;
  cities: string[];
  onChange: (city: string | null) => void;
}

/**
 * Props dla SearchBar component
 */
export interface SearchBarProps {
  initialValue: string;
  onSearchChange: (searchTerm: string) => void;
  placeholder?: string;
}

/**
 * Props dla Pagination component
 */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  isFirst: boolean;
  isLast: boolean;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

/**
 * Props dla RckikList component
 */
export interface RckikListProps {
  data: RckikListApiResponse | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Props dla EmptyState component
 */
export interface EmptyStateProps {
  title?: string;
  message?: string;
  onReset: () => void;
}

/**
 * Props dla ErrorState component
 */
export interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
}

/**
 * Props dla SkeletonList component
 */
export interface SkeletonListProps {
  count?: number;
}

// ===== Utility Types =====

/**
 * Mapy statusów do kolorów i ikon (dla BloodLevelBadge)
 */
export const BLOOD_LEVEL_STATUS_CONFIG: Record<BloodLevelStatus, {
  color: string; // Tailwind class
  icon: string; // nazwa ikony
  label: string; // tekst dla screen readers
}> = {
  CRITICAL: {
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: 'alert-circle',
    label: 'Krytyczny poziom'
  },
  IMPORTANT: {
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: 'alert-triangle',
    label: 'Ważny poziom'
  },
  OK: {
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: 'check-circle',
    label: 'Wystarczający poziom'
  }
};

/**
 * Default search params
 */
export const DEFAULT_RCKIK_SEARCH_PARAMS: RckikSearchParams = {
  page: 0,
  size: 20,
  search: '',
  city: null,
  active: true,
  sortBy: 'name',
  sortOrder: 'ASC'
};
