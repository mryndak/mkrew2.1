/**
 * Types for RCKiK Admin Management View
 * Typy dla widoku administracyjnego zarządzania centrami RCKiK
 * US-019: Admin RCKiK Management
 */

/**
 * DTO Types - zgodne z backendem
 */

/**
 * RCKiK DTO - pełne informacje o centrum
 */
export interface RckikDto {
  id: number;
  name: string;
  code: string;
  city: string;
  address: string | null;
  latitude: string | null; // BigDecimal jako string
  longitude: string | null; // BigDecimal jako string
  aliases: string[] | null;
  active: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Create RCKiK Request
 */
export interface CreateRckikRequest {
  name: string;
  code: string;
  city: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  aliases?: string[];
  active?: boolean; // default: true
}

/**
 * Update RCKiK Request
 */
export interface UpdateRckikRequest {
  name: string;
  code: string;
  city: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  aliases?: string[];
  active?: boolean;
}

/**
 * RCKiK List Response - odpowiedź z paginacją
 */
export interface RckikAdminListResponse {
  content: RckikDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/**
 * Error Response z API
 */
export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  details?: ValidationError[];
}

/**
 * Validation Error
 */
export interface ValidationError {
  field: string;
  message: string;
  rejectedValue?: any;
}

/**
 * Frontend ViewModels - typy specyficzne dla frontendu
 */

/**
 * Stan filtrów
 */
export interface FilterState {
  search: string;
  city: string | null;
  active: boolean | null; // null = wszystkie, true = aktywne, false = nieaktywne
}

/**
 * Konfiguracja sortowania
 */
export interface SortConfig {
  field: 'name' | 'code' | 'city' | 'updatedAt';
  order: 'ASC' | 'DESC';
}

/**
 * Stan paginacji
 */
export interface PaginationState {
  currentPage: number; // zero-based
  pageSize: number;
  totalPages: number;
  totalElements: number;
}

/**
 * Stan modali
 */
export interface ModalState {
  type: 'none' | 'create' | 'edit' | 'delete';
  data: RckikDto | null;
  isSubmitting: boolean;
}

/**
 * Stan zarządzania widokiem
 */
export interface ManagementState {
  rckikList: RckikDto[];
  isLoading: boolean;
  error: string | null;
  filters: FilterState;
  sort: SortConfig;
  pagination: PaginationState;
  modalState: ModalState;
}

/**
 * Błędy formularza
 */
export interface FormErrors {
  name?: string;
  code?: string;
  city?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  aliases?: string[];
  general?: string;
}

/**
 * Props dla komponentów
 */

/**
 * Props dla RckikManagementContainer
 */
export interface RckikManagementContainerProps {
  initialData?: RckikAdminListResponse;
  userRole: string;
}

/**
 * Props dla RckikFiltersBar
 */
export interface RckikFiltersBarProps {
  onFilterChange: (filters: FilterState) => void;
  initialFilters?: FilterState;
  availableCities: string[];
}

/**
 * Props dla RckikTable
 */
export interface RckikTableProps {
  data: RckikDto[];
  isLoading: boolean;
  sortConfig: SortConfig;
  onSortChange: (field: SortConfig['field']) => void;
  onEdit: (rckik: RckikDto) => void;
  onDelete: (rckik: RckikDto) => void;
}

/**
 * Props dla RckikTableRow
 */
export interface RckikTableRowProps {
  rckik: RckikDto;
  onEdit: (rckik: RckikDto) => void;
  onDelete: (rckik: RckikDto) => void;
}

/**
 * Props dla RckikForm
 */
export interface RckikFormProps {
  mode: 'create' | 'edit';
  initialData?: RckikDto;
  onSubmit: (data: CreateRckikRequest | UpdateRckikRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

/**
 * Props dla RckikFormModal
 */
export interface RckikFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: RckikDto;
  onClose: () => void;
  onSubmit: (data: CreateRckikRequest | UpdateRckikRequest) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Props dla ConfirmDeleteModal
 */
export interface ConfirmDeleteModalProps {
  rckik: RckikDto | null;
  isOpen: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting: boolean;
}

/**
 * Props dla Paginacji
 */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}
