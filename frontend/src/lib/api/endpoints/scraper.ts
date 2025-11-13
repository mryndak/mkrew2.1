import { apiClient } from '../client';
import type {
  ScraperGlobalStatusDto,
  ScraperRunDto,
  ScraperRunDetailsDto,
  TriggerScraperRequest,
  ScraperRunResponse,
  RunsFilters,
  PaginationParams,
  RunsListResponse,
} from '@/lib/types/scraper';

/**
 * Scraper API endpoints
 * Wszystkie endpointy wymagają autentykacji i roli ADMIN
 */
export const scraperApi = {
  /**
   * GET /admin/scraper/status
   * Pobiera globalny status scrapera (health check)
   */
  getGlobalStatus: async (): Promise<ScraperGlobalStatusDto> => {
    const response = await apiClient.get<ScraperGlobalStatusDto>('/admin/scraper/status');
    return response.data;
  },

  /**
   * GET /admin/scraper/runs
   * Pobiera listę uruchomień scrapera z filtrowaniem i paginacją
   */
  getRuns: async (
    filters: RunsFilters,
    pagination: PaginationParams
  ): Promise<RunsListResponse> => {
    // Konwersja status array na comma-separated string
    const params: Record<string, unknown> = {
      ...filters,
      status: filters.status?.join(','),
      page: pagination.page,
      size: pagination.size,
    };

    // Usuń undefined/null values
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        delete params[key];
      }
    });

    const response = await apiClient.get<RunsListResponse>('/admin/scraper/runs', { params });
    return response.data;
  },

  /**
   * GET /admin/scraper/runs/{id}
   * Pobiera szczegóły uruchomienia scrapera wraz z logami
   */
  getRunDetails: async (runId: number): Promise<ScraperRunDetailsDto> => {
    const response = await apiClient.get<ScraperRunDetailsDto>(`/admin/scraper/runs/${runId}`);
    return response.data;
  },

  /**
   * POST /admin/scraper/runs
   * Uruchamia scraper ręcznie
   */
  triggerScraper: async (data: TriggerScraperRequest): Promise<ScraperRunResponse> => {
    // Usuń puste pola
    const payload: TriggerScraperRequest = {};
    if (data.rckikId !== undefined && data.rckikId !== null) {
      payload.rckikId = data.rckikId;
    }
    if (data.url && data.url.trim() !== '') {
      payload.url = data.url.trim();
    }

    const response = await apiClient.post<ScraperRunResponse>('/admin/scraper/runs', payload);
    return response.data;
  },
};
