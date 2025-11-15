import { apiClient } from '../client';
import type {
  RckikDto,
  RckikAdminListResponse,
  CreateRckikRequest,
  UpdateRckikRequest,
  FilterState,
  SortConfig,
} from '@/lib/types/admin';
import type { AdminStatsResponse } from '@/lib/types/admin-stats';

/**
 * Admin RCKiK API endpoints
 * Wszystkie endpointy wymagają autentykacji i roli ADMIN
 * US-019: Admin RCKiK Management
 */

/**
 * Parametry zapytania dla listy RCKiK
 */
export interface FetchRckikAdminListParams {
  page?: number;
  size?: number;
  city?: string;
  active?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export const adminRckikApi = {
  /**
   * GET /admin/rckik
   * Pobiera listę centrów RCKiK z filtrowaniem, sortowaniem i paginacją
   */
  list: async (
    filters: FilterState,
    pagination: { page?: number; size?: number },
    sort?: SortConfig
  ): Promise<RckikAdminListResponse> => {
    // Przygotuj parametry zapytania
    const params: Record<string, unknown> = {
      page: pagination.page ?? 0,
      size: pagination.size ?? 20,
    };

    // Dodaj filtry (tylko jeśli mają wartość)
    if (filters.city) {
      params.city = filters.city;
    }
    if (filters.active !== null && filters.active !== undefined) {
      params.active = filters.active;
    }
    if (filters.search && filters.search.trim() !== '') {
      params.search = filters.search.trim();
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

    const response = await apiClient.get<RckikAdminListResponse>('/admin/rckik', { params });
    return response.data;
  },

  /**
   * GET /admin/rckik/{id}
   * Pobiera szczegóły pojedynczego centrum RCKiK
   */
  getById: async (id: number): Promise<RckikDto> => {
    const response = await apiClient.get<RckikDto>(`/admin/rckik/${id}`);
    return response.data;
  },

  /**
   * POST /admin/rckik
   * Tworzy nowe centrum RCKiK
   */
  create: async (data: CreateRckikRequest): Promise<RckikDto> => {
    // Walidacja przed wysłaniem
    const payload: CreateRckikRequest = {
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      city: data.city.trim(),
    };

    // Dodaj opcjonalne pola tylko jeśli mają wartość
    if (data.address && data.address.trim() !== '') {
      payload.address = data.address.trim();
    }
    if (data.latitude) {
      payload.latitude = data.latitude;
    }
    if (data.longitude) {
      payload.longitude = data.longitude;
    }
    if (data.aliases && data.aliases.length > 0) {
      // Usuń puste aliasy
      payload.aliases = data.aliases
        .map((alias) => alias.trim())
        .filter((alias) => alias !== '');
    }
    if (data.active !== undefined) {
      payload.active = data.active;
    }

    const response = await apiClient.post<RckikDto>('/admin/rckik', payload);
    return response.data;
  },

  /**
   * PUT /admin/rckik/{id}
   * Aktualizuje istniejące centrum RCKiK
   */
  update: async (id: number, data: UpdateRckikRequest): Promise<RckikDto> => {
    // Walidacja przed wysłaniem
    const payload: UpdateRckikRequest = {
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      city: data.city.trim(),
    };

    // Dodaj opcjonalne pola tylko jeśli mają wartość
    if (data.address !== undefined) {
      // Pozwalamy na pusty string (usunięcie adresu)
      payload.address = data.address ? data.address.trim() : '';
    }
    if (data.latitude !== undefined) {
      payload.latitude = data.latitude;
    }
    if (data.longitude !== undefined) {
      payload.longitude = data.longitude;
    }
    if (data.aliases !== undefined) {
      if (data.aliases.length > 0) {
        // Usuń puste aliasy
        payload.aliases = data.aliases
          .map((alias) => alias.trim())
          .filter((alias) => alias !== '');
      } else {
        payload.aliases = [];
      }
    }
    if (data.active !== undefined) {
      payload.active = data.active;
    }

    const response = await apiClient.put<RckikDto>(`/admin/rckik/${id}`, payload);
    return response.data;
  },

  /**
   * DELETE /admin/rckik/{id}
   * Usuwa (dezaktywuje) centrum RCKiK
   * Uwaga: Może być soft delete (active=false) lub hard delete w zależności od implementacji backendu
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/rckik/${id}`);
  },

  /**
   * Pobiera listę unikalnych miast dla filtru
   * Pomocnicza funkcja do wypełnienia dropdown z miastami
   */
  getAvailableCities: async (): Promise<string[]> => {
    try {
      // Pobierz wszystkie centra (bez paginacji) i wyciągnij unikalne miasta
      const response = await apiClient.get<RckikAdminListResponse>('/admin/rckik', {
        params: { size: 1000 }, // Pobierz wszystkie
      });

      // Wyciągnij unikalne miasta i posortuj alfabetycznie
      const cities = Array.from(new Set(response.data.content.map((rckik) => rckik.city))).sort();

      return cities;
    } catch (error) {
      console.error('Failed to fetch available cities:', error);
      return [];
    }
  },

  /**
   * GET /admin/stats
   * Pobiera statystyki dla dashboardu administracyjnego
   */
  getStats: async (): Promise<AdminStatsResponse> => {
    const response = await apiClient.get<AdminStatsResponse>('/admin/stats');
    return response.data;
  },
};
