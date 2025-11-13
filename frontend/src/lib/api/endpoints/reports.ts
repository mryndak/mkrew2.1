import { apiClient } from '../client';
import type {
  UserReportDto,
  ReportListResponse,
  UpdateUserReportRequest,
  ReportsFilterState,
  SortConfig,
} from '@/lib/types/reports';

/**
 * Reports API endpoints
 * Wszystkie endpointy wymagają autentykacji i roli ADMIN
 */

/**
 * Parametry paginacji dla listy raportów
 */
export interface ReportsPaginationParams {
  page?: number;
  size?: number;
}

/**
 * Parametry zapytania dla listy raportów
 */
export interface FetchReportsParams extends ReportsFilterState {
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export const reportsApi = {
  /**
   * GET /admin/reports
   * Pobiera listę raportów z filtrowaniem, sortowaniem i paginacją
   */
  getReports: async (
    filters: ReportsFilterState,
    pagination: ReportsPaginationParams,
    sort?: SortConfig
  ): Promise<ReportListResponse> => {
    // Przygotuj parametry zapytania
    const params: Record<string, unknown> = {
      page: pagination.page ?? 0,
      size: pagination.size ?? 20,
    };

    // Dodaj filtry (tylko jeśli mają wartość)
    if (filters.status && filters.status !== 'ALL') {
      params.status = filters.status;
    }
    if (filters.rckikId) {
      params.rckikId = filters.rckikId;
    }
    if (filters.fromDate) {
      params.fromDate = filters.fromDate;
    }
    if (filters.toDate) {
      params.toDate = filters.toDate;
    }
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      params.searchQuery = filters.searchQuery.trim();
    }

    // Dodaj sortowanie
    if (sort) {
      params.sortBy = sort.field;
      params.sortOrder = sort.order;
    }

    // Usuń undefined/null values
    Object.keys(params).forEach((key) => {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        delete params[key];
      }
    });

    const response = await apiClient.get<ReportListResponse>('/admin/reports', { params });
    return response.data;
  },

  /**
   * GET /admin/reports/{id}
   * Pobiera szczegóły pojedynczego raportu
   */
  getReportDetails: async (reportId: number): Promise<UserReportDto> => {
    const response = await apiClient.get<UserReportDto>(`/admin/reports/${reportId}`);
    return response.data;
  },

  /**
   * PATCH /admin/reports/{id}
   * Aktualizuje status i/lub notatki raportu (admin only)
   */
  updateReport: async (
    reportId: number,
    updates: UpdateUserReportRequest
  ): Promise<UserReportDto> => {
    // Usuń puste pola
    const payload: UpdateUserReportRequest = {};
    if (updates.status) {
      payload.status = updates.status;
    }
    if (updates.adminNotes !== undefined) {
      // Pozwalamy na pusty string (usunięcie notatek)
      payload.adminNotes = updates.adminNotes;
    }

    const response = await apiClient.patch<UserReportDto>(
      `/admin/reports/${reportId}`,
      payload
    );
    return response.data;
  },

  /**
   * Quick action: Resolve report
   * Ustawia status na RESOLVED
   */
  resolveReport: async (reportId: number, adminNotes?: string): Promise<UserReportDto> => {
    return reportsApi.updateReport(reportId, {
      status: 'RESOLVED',
      adminNotes,
    });
  },

  /**
   * Quick action: Reject report
   * Ustawia status na REJECTED
   */
  rejectReport: async (reportId: number, adminNotes?: string): Promise<UserReportDto> => {
    return reportsApi.updateReport(reportId, {
      status: 'REJECTED',
      adminNotes,
    });
  },

  /**
   * Quick action: Mark as in review
   * Ustawia status na IN_REVIEW
   */
  markAsInReview: async (reportId: number, adminNotes?: string): Promise<UserReportDto> => {
    return reportsApi.updateReport(reportId, {
      status: 'IN_REVIEW',
      adminNotes,
    });
  },
};
