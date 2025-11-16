/**
 * Typy dla widoku Parser Configuration Management
 * Mapowane z backend DTOs (US-029, US-030)
 */

/**
 * Parser Type - typy parserów
 */
export type ParserType = 'JSOUP' | 'SELENIUM' | 'CUSTOM';

/**
 * Parser Status - status parsera
 */
export type ParserStatus = 'SUCCESS' | 'PARTIAL' | 'FAILED';

/**
 * Test Status - status testu
 */
export type TestStatus = 'SUCCESS' | 'PARTIAL' | 'FAILED';

/**
 * Level Status - status poziomu krwi
 */
export type LevelStatus = 'OK' | 'IMPORTANT' | 'CRITICAL';

/**
 * Audit Action - akcje w audit trail
 */
export type AuditAction = 'PARSER_CONFIG_CREATED' | 'PARSER_CONFIG_UPDATED' | 'PARSER_CONFIG_DELETED';

/**
 * Backend DTO Types
 */

/**
 * DTO: Parser Config Response
 * Response z GET /api/v1/admin/parsers/configs/{id}
 */
export interface ParserConfigDto {
  id: number;
  rckikId: number;
  rckikName: string;
  rckikCode: string;
  sourceUrl: string;
  parserType: ParserType;
  cssSelectors: CssSelectorConfig; // JSON object
  active: boolean;
  scheduleCron: string;
  timeoutSeconds: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  lastSuccessfulRun: string | null; // ISO 8601
  lastRunStatus: ParserStatus | null;
  recentRuns?: RecentRunDto[];
  auditTrail?: AuditTrailEntryDto[];
}

/**
 * DTO: Parser Config List Response
 * Response z GET /api/v1/admin/parsers/configs
 */
export interface ParserConfigListResponse {
  content: ParserConfigDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
}

/**
 * DTO: Recent Run
 * Ostatnie uruchomienia parsera
 */
export interface RecentRunDto {
  runId: number;
  startedAt: string; // ISO 8601
  status: ParserStatus;
  recordsParsed: number;
  recordsFailed: number;
  responseTimeMs: number;
}

/**
 * DTO: Audit Trail Entry
 * Wpis w historii zmian
 */
export interface AuditTrailEntryDto {
  action: AuditAction;
  actorId: string; // email
  timestamp: string; // ISO 8601
  metadata: {
    changes?: Record<string, { old: any; new: any }>;
    notes?: string;
  };
}

/**
 * DTO: Parser Config Request
 * Request body dla POST/PUT /api/v1/admin/parsers/configs
 */
export interface ParserConfigRequest {
  rckikId: number;
  sourceUrl: string;
  parserType: ParserType;
  cssSelectors: string; // JSON string
  active?: boolean;
  scheduleCron?: string;
  timeoutSeconds?: number;
  notes?: string;
}

/**
 * DTO: Parser Test Request
 * Request body dla POST /api/v1/admin/parsers/configs/{id}/test
 */
export interface ParserTestRequest {
  testUrl?: string; // Optional override URL
}

/**
 * DTO: Parser Test Response
 * Response z POST /api/v1/admin/parsers/configs/{id}/test
 */
export interface ParserTestResponse {
  testId: string;
  configId: number;
  rckikId: number;
  rckikName: string;
  testUrl: string;
  parserType: ParserType;
  status: TestStatus;
  executionTimeMs: number;
  httpStatusCode: number;
  parsedData: ParsedDataEntry[];
  warnings: string[];
  errors: string[];
  summary: TestSummary;
}

/**
 * DTO: Parsed Data Entry
 * Pojedynczy wpis sparsowanych danych
 */
export interface ParsedDataEntry {
  bloodGroup: string;
  levelPercentage: number;
  levelStatus: LevelStatus;
  source: SourceInfo;
}

/**
 * DTO: Source Info
 * Informacje o źródle danych (selektor + raw text)
 */
export interface SourceInfo {
  selector: string;
  rawText: string;
}

/**
 * DTO: Test Summary
 * Podsumowanie testu
 */
export interface TestSummary {
  totalGroupsExpected: number;
  totalGroupsFound: number;
  successfulParses: number;
  failedParses: number;
  saved: boolean;
}

/**
 * Frontend ViewModel Types
 */

/**
 * CSS Selector Config - konfiguracja selektorów CSS
 * Używane w Monaco Editor jako JSON
 */
export interface CssSelectorConfig {
  container?: string;
  bloodGroupRow: string;
  bloodGroupName: string;
  levelPercentage: string;
  dateSelector?: string;
  customFields?: Record<string, string>;
}

/**
 * Parser Config Form Data - dane formularza
 * Używane w React Hook Form
 */
export interface ParserConfigFormData {
  rckikId: number;
  parserType: ParserType;
  sourceUrl: string;
  cssSelectors: CssSelectorConfig;
  scheduleCron: string;
  timeoutSeconds: number;
  active: boolean;
  notes?: string;
}

/**
 * Parser Config Filters State - stan filtrów
 */
export interface ParserConfigFiltersState {
  rckikId?: number | null;
  parserType?: ParserType | null;
  active?: boolean | null;
}

/**
 * Parser Config Table State - stan tabeli
 */
export interface ParserConfigTableState {
  configs: ParserConfigDto[];
  totalElements: number;
  currentPage: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  filters: ParserConfigFiltersState;
  loading: boolean;
  error: string | null;
}

/**
 * Test Parser Modal State - stan modalu testowania
 */
export interface TestParserModalState {
  isOpen: boolean;
  configId: number | null;
  testUrl: string;
  testResult: ParserTestResponse | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Parser Config Form Modal State - stan modalu formularza
 */
export interface ParserConfigFormModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  configId: number | null;
  initialData: ParserConfigDto | null;
  isDirty: boolean;
}

/**
 * RCKiK Basic DTO - uproszczone info o centrum
 */
export interface RckikBasicDto {
  id: number;
  name: string;
  code: string;
  city: string;
}

/**
 * Pagination State - stan paginacji
 */
export interface PaginationState {
  currentPage: number; // 0-indexed
  pageSize: number;
  totalPages: number;
  totalElements: number;
}

/**
 * Sort Config - konfiguracja sortowania
 */
export interface SortConfig {
  field: 'rckikName' | 'parserType' | 'active' | 'lastSuccessfulRun';
  order: 'ASC' | 'DESC';
}

/**
 * Props Types
 */

/**
 * Props: Parser Config Filters
 */
export interface ParserConfigFiltersProps {
  onFiltersChange: (filters: ParserConfigFiltersState) => void;
  initialFilters?: ParserConfigFiltersState;
}

/**
 * Props: Parser Config Table
 */
export interface ParserConfigTableProps {
  configs: ParserConfigDto[];
  totalElements: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSort: (column: string, direction: 'asc' | 'desc') => void;
  onEdit: (configId: number) => void;
  onTest: (configId: number) => void;
  onDelete: (configId: number) => void;
}

/**
 * Props: Parser Config Form Modal
 */
export interface ParserConfigFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: ParserConfigDto;
  onClose: () => void;
  onSave: (data: ParserConfigFormData) => Promise<void>;
  onTestAndSave: (data: ParserConfigFormData) => Promise<void>;
}

/**
 * Props: Test Parser Modal
 */
export interface TestParserModalProps {
  isOpen: boolean;
  configId: number;
  onClose: () => void;
  onSaveResults?: (testId: string) => Promise<void>;
}

/**
 * Props: Parse Results Preview
 */
export interface ParseResultsPreviewProps {
  parsedData: ParsedDataEntry[];
  warnings: string[];
  errors: string[];
}

/**
 * Props: Parser Status Badge
 */
export interface ParserStatusBadgeProps {
  active: boolean;
  lastRunStatus: ParserStatus | null;
}

/**
 * Props: Audit Trail Timeline
 */
export interface AuditTrailTimelineProps {
  auditTrail: AuditTrailEntryDto[];
}

/**
 * Props: RCKiK Select
 */
export interface RckikSelectProps {
  value: number | null;
  onChange: (rckikId: number) => void;
  disabled?: boolean;
  error?: string;
}

/**
 * Props: URL Input
 */
export interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}

/**
 * Props: JSON Editor
 */
export interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange: (isValid: boolean, errors?: string[]) => void;
  height?: string; // default: "300px"
  readOnly?: boolean;
}

/**
 * API Error Response
 */
export interface ApiError {
  error: string;
  message: string;
  violations?: Array<{
    field: string;
    message: string;
  }>;
  timestamp?: string;
  path?: string;
}
