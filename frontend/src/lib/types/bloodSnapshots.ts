/**
 * Typy dla widoku Blood Snapshots - ręczne wprowadzanie stanów krwi
 * Mapowane z backend DTOs (US-028)
 */

/**
 * Blood Group Types - Enum grup krwi
 * Backend używa notacji "0+" zamiast "O+"
 */
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | '0+' | '0-';

/**
 * Level Status Types
 */
export type LevelStatus = 'CRITICAL' | 'IMPORTANT' | 'OK' | 'UNKNOWN';

/**
 * Source Type - źródło snapshotu
 */
export type SnapshotSource = 'manual' | 'scraped' | 'all';

/**
 * Backend DTO Types
 */

/**
 * DTO: Create Blood Snapshot Request
 * Request body dla POST /api/v1/admin/blood-snapshots
 */
export interface CreateBloodSnapshotRequest {
  rckikId: number;
  snapshotDate: string; // ISO 8601: YYYY-MM-DD
  bloodGroup: string; // Backend pattern: 0+, 0-, A+, A-, B+, B-, AB+, AB-
  levelPercentage: number; // 0.00-100.00, max 2 decimal places
  notes?: string; // max 500 characters
}

/**
 * DTO: Update Blood Snapshot Request
 * Request body dla PUT /api/v1/admin/blood-snapshots/{id}
 */
export interface UpdateBloodSnapshotRequest {
  levelPercentage: number; // 0.00-100.00
  notes?: string; // max 500 characters
}

/**
 * DTO: Blood Snapshot Response
 * Response z backendu dla pojedynczego snapshotu
 */
export interface BloodSnapshotResponse {
  id: number;
  rckikId: number;
  rckikName: string;
  rckikCode: string;
  snapshotDate: string; // ISO 8601 date
  bloodGroup: string;
  levelPercentage: number;
  levelStatus: LevelStatus;
  sourceUrl: string | null;
  parserVersion: string | null;
  scrapedAt: string; // ISO 8601 datetime
  isManual: boolean;
  createdBy: string | null; // email admina lub null
  createdAt: string; // ISO 8601 datetime
  auditTrail?: {
    notes?: string;
  };
}

/**
 * DTO: RCKiK Basic Info
 * Uproszczone info o centrum RCKiK dla dropdown/select
 */
export interface RckikBasicDto {
  id: number;
  name: string;
  code: string;
  city: string;
  isActive?: boolean;
}

/**
 * Frontend ViewModel Types
 */

/**
 * ManualSnapshotFormData - dane formularza (przed konwersją)
 * Używane w React Hook Form
 */
export interface ManualSnapshotFormData {
  rckikId: number | null;
  snapshotDate: Date | null;
  bloodGroup: string;
  levelPercentage: string; // string w formularzu, konwersja do number przed submit
  notes: string;
}

/**
 * SnapshotFilters - filtry dla tabeli snapshotów
 */
export interface SnapshotFilters {
  rckikId?: number | null;
  bloodGroup?: string | null;
  fromDate?: string | null; // ISO 8601
  toDate?: string | null; // ISO 8601
  source?: SnapshotSource;
  createdBy?: string | null;
  manualOnly?: boolean; // Query parameter dla API
}

/**
 * PaginationState - stan paginacji
 */
export interface PaginationState {
  page: number; // 0-indexed
  size: number; // elementy na stronę (default: 50)
  totalElements: number;
  totalPages: number;
}

/**
 * StatsData - statystyki ręcznych snapshotów
 */
export interface StatsData {
  today: number;
  thisWeek: number;
  thisMonth: number;
}

/**
 * SortConfig - konfiguracja sortowania
 */
export interface SortConfig {
  column: keyof BloodSnapshotResponse;
  direction: 'asc' | 'desc';
}

/**
 * BloodSnapshotsListResponse - response z listą snapshotów i paginacją
 * Response z GET /api/v1/admin/blood-snapshots
 */
export interface BloodSnapshotsListResponse {
  content: BloodSnapshotResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
}

/**
 * ApiError - struktura błędu z API
 */
export interface ApiError {
  error: string;
  message: string;
  violations?: Array<{
    field: string;
    message: string;
  }>;
  existingSnapshotId?: number; // dla konfliktów duplikatów (409)
}

/**
 * Modal Mode - tryb modalu (create/edit)
 */
export type ModalMode = 'create' | 'edit';
