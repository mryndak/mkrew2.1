/**
 * Typy dla widoku Scraper - monitorowanie i zarządzanie web scrapingiem
 * Mapowane z backend DTOs
 */

/**
 * Global Status Types
 */
export type GlobalStatus = 'OK' | 'DEGRADED' | 'FAILED';

/**
 * Run Status Types
 */
export type RunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';

/**
 * Run Type
 */
export type RunType = 'SCHEDULED' | 'MANUAL';

/**
 * Log Status Types
 */
export type LogStatus = 'SUCCESS' | 'PARTIAL' | 'FAILED';

/**
 * DTO: Global scraper health status
 */
export interface ScraperGlobalStatusDto {
  globalStatus: GlobalStatus;
  lastSuccessfulTimestamp: string; // ISO 8601
  consecutiveFailures: number;
  totalRecentRuns: number;
  successfulRecentRuns: number;
  failedRecentRuns: number;
  message: string;
  requiresAdminAlert: boolean;
}

/**
 * DTO: Scraper run summary
 */
export interface ScraperRunDto {
  id: number;
  runType: RunType;
  startedAt: string; // ISO 8601
  completedAt: string | null; // null jeśli RUNNING
  totalRckiks: number;
  successfulCount: number;
  failedCount: number;
  durationSeconds: number | null;
  triggeredBy: string; // email lub "SYSTEM"
  status: RunStatus;
  errorSummary: string | null;
}

/**
 * DTO: Scraper run details with logs
 */
export interface ScraperRunDetailsDto {
  id: number;
  runType: RunType;
  startedAt: string;
  completedAt: string | null;
  totalRckiks: number;
  successfulCount: number;
  failedCount: number;
  durationSeconds: number | null;
  triggeredBy: string;
  status: RunStatus;
  errorSummary: string | null;
  logs: ScraperLogDto[];
}

/**
 * DTO: Scraper log entry
 */
export interface ScraperLogDto {
  id: number;
  scraperRunId: number;
  rckikId: number;
  rckikName: string;
  url: string;
  status: LogStatus;
  errorMessage: string | null;
  parserVersion: string;
  responseTimeMs: number;
  httpStatusCode: number | null;
  recordsParsed: number;
  recordsFailed: number;
  createdAt: string;
}

/**
 * Request: Trigger manual scraper run
 */
export interface TriggerScraperRequest {
  rckikId?: number; // opcjonalny
  url?: string; // opcjonalny
}

/**
 * Response: Scraper run trigger response
 */
export interface ScraperRunResponse {
  scraperId: number;
  runType: RunType;
  status: RunStatus;
  triggeredBy: string;
  startedAt: string;
  statusUrl: string;
}

/**
 * Basic RCKiK info for selector
 */
export interface RckikBasicDto {
  id: number;
  name: string;
  code: string;
  city: string;
}

/**
 * ViewModel Types - Frontend specific
 */

/**
 * Filters for runs list
 */
export interface RunsFilters {
  runType?: RunType | null;
  status?: RunStatus[];
  fromDate?: string; // ISO 8601 date
  toDate?: string; // ISO 8601 date
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number; // 0-indexed
  size: number; // default: 20
}

/**
 * Runs list response with pagination
 */
export interface RunsListResponse {
  runs: ScraperRunDto[];
  page: number;
  totalElements: number;
  totalPages: number;
}

/**
 * Manual trigger form data
 */
export interface ManualTriggerFormData {
  rckikId: number | null;
  customUrl: string;
  confirmed: boolean;
}

/**
 * Error response structure
 */
export interface ApiErrorResponse {
  status: number;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}
