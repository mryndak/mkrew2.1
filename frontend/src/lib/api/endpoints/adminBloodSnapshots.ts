import { apiClient } from '../client';
import type {
  CreateBloodSnapshotRequest,
  UpdateBloodSnapshotRequest,
  BloodSnapshotResponse,
  BloodSnapshotsListResponse,
  SnapshotFilters,
  StatsData,
} from '@/lib/types/bloodSnapshots';

/**
 * Admin Blood Snapshots API endpoints
 * Wszystkie endpointy wymagają autentykacji i roli ADMIN
 * US-028: Ręczne wprowadzanie stanów krwi
 */

/**
 * Parametry zapytania dla listy snapshotów
 */
export interface FetchSnapshotsParams extends Partial<SnapshotFilters> {
  page?: number;
  size?: number;
}

export const adminBloodSnapshotsApi = {
  /**
   * POST /api/v1/admin/blood-snapshots
   * Tworzy nowy ręczny snapshot krwi
   */
  createSnapshot: async (data: CreateBloodSnapshotRequest): Promise<BloodSnapshotResponse> => {
    // Walidacja i przygotowanie payloadu
    const payload: CreateBloodSnapshotRequest = {
      rckikId: data.rckikId,
      snapshotDate: data.snapshotDate,
      bloodGroup: data.bloodGroup,
      levelPercentage: Number(data.levelPercentage),
    };

    // Dodaj notatki tylko jeśli istnieją
    if (data.notes && data.notes.trim() !== '') {
      payload.notes = data.notes.trim();
    }

    const response = await apiClient.post<BloodSnapshotResponse>(
      '/admin/blood-snapshots',
      payload
    );
    return response.data;
  },

  /**
   * GET /api/v1/admin/blood-snapshots
   * Pobiera listę snapshotów z filtrowaniem i paginacją
   */
  listSnapshots: async (params: FetchSnapshotsParams = {}): Promise<BloodSnapshotsListResponse> => {
    // Przygotuj parametry zapytania
    const queryParams: Record<string, unknown> = {
      page: params.page ?? 0,
      size: params.size ?? 50,
    };

    // Dodaj filtry (tylko jeśli mają wartość)
    if (params.rckikId) {
      queryParams.rckikId = params.rckikId;
    }
    if (params.bloodGroup) {
      queryParams.bloodGroup = params.bloodGroup;
    }
    if (params.fromDate) {
      queryParams.fromDate = params.fromDate;
    }
    if (params.toDate) {
      queryParams.toDate = params.toDate;
    }
    if (params.createdBy) {
      queryParams.createdBy = params.createdBy;
    }

    // Source filter - mapowanie na manualOnly parameter
    if (params.source === 'manual') {
      queryParams.manualOnly = true;
    } else if (params.source === 'scraped') {
      queryParams.manualOnly = false;
    }
    // 'all' - nie dodajemy parametru

    // Usuń undefined/null values
    Object.keys(queryParams).forEach((key) => {
      if (queryParams[key] === undefined || queryParams[key] === null || queryParams[key] === '') {
        delete queryParams[key];
      }
    });

    const response = await apiClient.get<BloodSnapshotsListResponse>(
      '/admin/blood-snapshots',
      { params: queryParams }
    );
    return response.data;
  },

  /**
   * GET /api/v1/admin/blood-snapshots/{id}
   * Pobiera szczegóły pojedynczego snapshotu z audit trail
   */
  getSnapshot: async (id: number): Promise<BloodSnapshotResponse> => {
    const response = await apiClient.get<BloodSnapshotResponse>(`/admin/blood-snapshots/${id}`);
    return response.data;
  },

  /**
   * PUT /api/v1/admin/blood-snapshots/{id}
   * Aktualizuje istniejący ręczny snapshot
   * Uwaga: Można edytować tylko ręczne snapshoty (isManual=true)
   */
  updateSnapshot: async (
    id: number,
    data: UpdateBloodSnapshotRequest
  ): Promise<BloodSnapshotResponse> => {
    // Walidacja i przygotowanie payloadu
    const payload: UpdateBloodSnapshotRequest = {
      levelPercentage: Number(data.levelPercentage),
    };

    // Dodaj notatki (może być pusty string - usunięcie notatek)
    if (data.notes !== undefined) {
      payload.notes = data.notes.trim();
    }

    const response = await apiClient.put<BloodSnapshotResponse>(
      `/admin/blood-snapshots/${id}`,
      payload
    );
    return response.data;
  },

  /**
   * DELETE /api/v1/admin/blood-snapshots/{id}
   * Usuwa ręczny snapshot
   * Uwaga: Można usuwać tylko ręczne snapshoty (isManual=true)
   */
  deleteSnapshot: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/blood-snapshots/${id}`);
  },

  /**
   * Pobiera statystyki ręcznie wprowadzonych snapshotów
   * Oblicza na podstawie list z filtrami dat
   */
  getStats: async (): Promise<StatsData> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      // Równoległe zapytania dla trzech okresów
      const [todayData, weekData, monthData] = await Promise.all([
        adminBloodSnapshotsApi.listSnapshots({
          fromDate: today,
          toDate: today,
          source: 'manual',
          size: 1,
        }),
        adminBloodSnapshotsApi.listSnapshots({
          fromDate: weekAgo,
          toDate: today,
          source: 'manual',
          size: 1,
        }),
        adminBloodSnapshotsApi.listSnapshots({
          fromDate: monthAgo,
          toDate: today,
          source: 'manual',
          size: 1,
        }),
      ]);

      return {
        today: todayData.totalElements,
        thisWeek: weekData.totalElements,
        thisMonth: monthData.totalElements,
      };
    } catch (error) {
      console.error('Failed to fetch blood snapshots stats:', error);
      return {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
      };
    }
  },
};
