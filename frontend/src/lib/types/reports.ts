/**
 * Types for Reports View
 * Reprezentacja typów z backendu dla widoku raportów użytkowników
 */

/**
 * Report Status enum
 */
export type ReportStatus = 'NEW' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED';

/**
 * User Summary DTO - podstawowe informacje o użytkowniku
 */
export interface UserSummaryDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * User Report DTO - szczegóły pojedynczego raportu
 */
export interface UserReportDto {
  id: number;
  user: UserSummaryDto;
  rckikId: number;
  rckikName: string;
  bloodSnapshotId?: number;
  description: string;
  screenshotUrl?: string;
  status: ReportStatus;
  adminNotes?: string;
  resolvedBy?: UserSummaryDto;
  resolvedAt?: string; // ISO 8601
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Create User Report Request
 */
export interface CreateUserReportRequest {
  rckikId: number;
  bloodSnapshotId?: number;
  description: string; // max 2000 chars
  screenshotUrl?: string; // max 2048 chars
}

/**
 * Update User Report Request (admin only)
 */
export interface UpdateUserReportRequest {
  status?: ReportStatus;
  adminNotes?: string; // max 2000 chars
}

/**
 * RCKiK Basic DTO
 */
export interface RckikBasicDto {
  id: number;
  name: string;
  code: string;
  city: string;
}

/**
 * Frontend specific types
 */

/**
 * Report List Response - paginated response z API
 */
export interface ReportListResponse {
  reports: UserReportDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/**
 * Reports Filter State - stan filtrów
 */
export interface ReportsFilterState {
  status?: ReportStatus | 'ALL';
  rckikId?: number;
  fromDate?: string; // ISO 8601 date
  toDate?: string; // ISO 8601 date
  searchQuery?: string;
}

/**
 * Sort Configuration
 */
export interface SortConfig {
  field: 'id' | 'status' | 'createdAt' | 'rckikName' | 'userName';
  order: 'ASC' | 'DESC';
}

/**
 * Pagination State
 */
export interface PaginationState {
  page: number; // 0-indexed
  size: number; // 20, 50, 100
  totalElements: number;
  totalPages: number;
}

/**
 * Reports View State - globalny stan widoku
 */
export interface ReportsViewState {
  reports: UserReportDto[];
  loading: boolean;
  error: string | null;
  filters: ReportsFilterState;
  sortConfig: SortConfig;
  pagination: PaginationState;
  selectedReportId: number | null;
  modalOpen: boolean;
}

/**
 * Report Statistics - statystyki raportów
 */
export interface ReportStatistics {
  total: number;
  new: number;
  inReview: number;
  resolved: number;
  rejected: number;
}

/**
 * Props dla komponentów
 */

export interface ReportsViewProps {
  initialData?: ReportListResponse;
}

export interface ReportsFiltersProps {
  filters: ReportsFilterState;
  onFiltersChange: (filters: ReportsFilterState) => void;
  rckikOptions: RckikBasicDto[];
}

export interface ReportsTableProps {
  reports: UserReportDto[];
  loading: boolean;
  sortConfig: SortConfig;
  onSortChange: (field: SortConfig['field']) => void;
  onRowClick: (reportId: number) => void;
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export interface ReportsTableRowProps {
  report: UserReportDto;
  onClick: (reportId: number) => void;
}

export interface ReportDetailsModalProps {
  reportId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void; // Callback po aktualizacji (odświeża listę)
}

export interface ReportStatusBadgeProps {
  status: ReportStatus;
  size?: 'small' | 'medium' | 'large';
}

export interface EmptyStateProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}
