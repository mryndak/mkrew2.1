import { apiClient } from '../client';
import type {
  ParserConfigDto,
  ParserConfigListResponse,
  ParserConfigRequest,
  ParserTestRequest,
  ParserTestResponse,
  ParserConfigFiltersState,
} from '@/lib/types/parserConfig';

/**
 * Admin Parser Configuration API endpoints
 * Wszystkie endpointy wymagają autentykacji i roli ADMIN
 * US-029, US-030: Zarządzanie konfiguracją parserów dla RCKiK
 */

/**
 * Parametry zapytania dla listy konfiguracji
 */
export interface FetchConfigsParams extends Partial<ParserConfigFiltersState> {
  page?: number;
  size?: number;
  sort?: string; // format: "field,direction" np. "rckikName,asc"
}

export const adminParsersApi = {
  /**
   * GET /api/v1/admin/parsers/configs
   * Pobiera listę konfiguracji parserów z filtrowaniem i paginacją
   */
  getConfigs: async (params: FetchConfigsParams = {}): Promise<ParserConfigListResponse> => {
    // Przygotuj parametry zapytania
    const queryParams: Record<string, unknown> = {
      page: params.page ?? 0,
      size: params.size ?? 50,
    };

    // Dodaj filtry (tylko jeśli mają wartość)
    if (params.rckikId) {
      queryParams.rckikId = params.rckikId;
    }
    if (params.parserType) {
      queryParams.parserType = params.parserType;
    }
    if (params.active !== undefined && params.active !== null) {
      queryParams.active = params.active;
    }
    if (params.sort) {
      queryParams.sort = params.sort;
    }

    // Usuń undefined/null values
    Object.keys(queryParams).forEach((key) => {
      if (queryParams[key] === undefined || queryParams[key] === null || queryParams[key] === '') {
        delete queryParams[key];
      }
    });

    const response = await apiClient.get<ParserConfigListResponse>(
      '/admin/parsers/configs',
      { params: queryParams }
    );
    return response.data;
  },

  /**
   * GET /api/v1/admin/parsers/configs/{id}
   * Pobiera szczegóły konfiguracji parsera z recent runs i audit trail
   */
  getConfigDetails: async (id: number): Promise<ParserConfigDto> => {
    const response = await apiClient.get<ParserConfigDto>(`/admin/parsers/configs/${id}`);
    return response.data;
  },

  /**
   * POST /api/v1/admin/parsers/configs
   * Tworzy nową konfigurację parsera
   */
  createConfig: async (data: ParserConfigRequest): Promise<ParserConfigDto> => {
    // Walidacja i przygotowanie payloadu
    const payload: ParserConfigRequest = {
      rckikId: data.rckikId,
      sourceUrl: data.sourceUrl,
      parserType: data.parserType,
      cssSelectors: data.cssSelectors, // JSON string
      active: data.active ?? true,
      scheduleCron: data.scheduleCron || '0 2 * * *',
      timeoutSeconds: data.timeoutSeconds || 30,
    };

    // Dodaj notatki tylko jeśli istnieją
    if (data.notes && data.notes.trim() !== '') {
      payload.notes = data.notes.trim();
    }

    const response = await apiClient.post<ParserConfigDto>(
      '/admin/parsers/configs',
      payload
    );
    return response.data;
  },

  /**
   * PUT /api/v1/admin/parsers/configs/{id}
   * Aktualizuje istniejącą konfigurację parsera
   * Uwaga: rckikId i parserType są immutable (nie można ich zmienić)
   */
  updateConfig: async (
    id: number,
    data: Partial<ParserConfigRequest>
  ): Promise<ParserConfigDto> => {
    // Przygotuj payload (tylko pola do aktualizacji)
    const payload: Partial<ParserConfigRequest> = {};

    if (data.sourceUrl !== undefined) {
      payload.sourceUrl = data.sourceUrl;
    }
    if (data.cssSelectors !== undefined) {
      payload.cssSelectors = data.cssSelectors;
    }
    if (data.active !== undefined) {
      payload.active = data.active;
    }
    if (data.scheduleCron !== undefined) {
      payload.scheduleCron = data.scheduleCron;
    }
    if (data.timeoutSeconds !== undefined) {
      payload.timeoutSeconds = data.timeoutSeconds;
    }
    if (data.notes !== undefined) {
      payload.notes = data.notes.trim();
    }

    const response = await apiClient.put<ParserConfigDto>(
      `/admin/parsers/configs/${id}`,
      payload
    );
    return response.data;
  },

  /**
   * DELETE /api/v1/admin/parsers/configs/{id}
   * Dezaktywuje konfigurację parsera (soft delete - ustawia active=false)
   */
  deleteConfig: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/parsers/configs/${id}`);
  },

  /**
   * POST /api/v1/admin/parsers/configs/{id}/test
   * Testuje parser w trybie dry-run (bez zapisu do bazy)
   * Query param: saveResults (boolean) - czy zapisać wyniki do bazy
   */
  testParser: async (
    id: number,
    request: ParserTestRequest = {},
    saveResults = false
  ): Promise<ParserTestResponse> => {
    const queryParams: Record<string, unknown> = {};

    if (saveResults) {
      queryParams.saveResults = true;
    }

    const response = await apiClient.post<ParserTestResponse>(
      `/admin/parsers/configs/${id}/test`,
      request,
      { params: queryParams }
    );
    return response.data;
  },

  /**
   * POST /api/v1/admin/parsers/configs/{id}/test?saveResults=true
   * Zapisuje wyniki testu do bazy danych
   * Helper metoda dla testParser z saveResults=true
   */
  testAndSaveParser: async (
    id: number,
    request: ParserTestRequest = {}
  ): Promise<ParserTestResponse> => {
    return adminParsersApi.testParser(id, request, true);
  },
};
