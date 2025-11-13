import { apiClient } from '../client';
import type {
  RckikListApiResponse,
  RckikSearchParams,
  RckikDetailDto,
  BloodLevelHistoryResponse
} from '../../../types/rckik';

/**
 * Fetch lista RCKiK z filtrowaniem i paginacją
 * Endpoint: GET /api/v1/rckik
 *
 * @param params - Parametry wyszukiwania (paginacja, filtry, sortowanie)
 * @returns Promise z paginowaną listą centrów RCKiK
 */
export async function fetchRckikList(params: RckikSearchParams): Promise<RckikListApiResponse> {
  const queryParams = new URLSearchParams();

  // Dodaj tylko non-default params do URL
  if (params.page > 0) {
    queryParams.set('page', String(params.page));
  }
  if (params.size !== 20) {
    queryParams.set('size', String(params.size));
  }
  if (params.search) {
    queryParams.set('search', params.search);
  }
  if (params.city) {
    queryParams.set('city', params.city);
  }
  if (!params.active) {
    queryParams.set('active', 'false');
  }
  if (params.sortBy !== 'name') {
    queryParams.set('sortBy', params.sortBy);
  }
  if (params.sortOrder !== 'ASC') {
    queryParams.set('sortOrder', params.sortOrder);
  }

  const response = await apiClient.get<RckikListApiResponse>(
    `/rckik${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  );

  return response.data;
}

/**
 * Fetch unikalne miasta dla filtru
 * Opcja 1: fetch all RCKiK i extract unique cities (dla MVP)
 * Opcja 2: dedykowany endpoint GET /api/v1/rckik/cities (jeśli zostanie dodany w backend)
 *
 * @returns Promise z listą unikalnych miast (posortowane alfabetycznie)
 */
export async function fetchAvailableCities(): Promise<string[]> {
  try {
    // Fetch pierwszych 100 centrów (zakładamy że to wystarczy dla listy miast)
    const response = await apiClient.get<RckikListApiResponse>('/rckik?size=100&active=true');

    // Extract unique cities i sortuj alfabetycznie
    const cities = [...new Set(response.data.content.map(rckik => rckik.city))];
    return cities.sort((a, b) => a.localeCompare(b, 'pl'));
  } catch (error) {
    console.error('Failed to fetch available cities:', error);
    return [];
  }
}

/**
 * Fetch szczegółowe dane centrum RCKiK
 * Endpoint: GET /api/v1/rckik/{id}
 *
 * @param id - ID centrum RCKiK
 * @returns Promise ze szczegółowymi danymi centrum
 */
export async function fetchRckikDetails(id: number): Promise<RckikDetailDto> {
  const response = await apiClient.get<RckikDetailDto>(`/rckik/${id}`);
  return response.data;
}

/**
 * Fetch historyczne snapshoty poziomów krwi
 * Endpoint: GET /api/v1/rckik/{id}/blood-levels
 *
 * @param id - ID centrum RCKiK
 * @param params - Parametry filtrowania i paginacji
 * @returns Promise z paginowaną listą snapshotów historycznych
 */
export async function fetchBloodLevelHistory(
  id: number,
  params?: {
    bloodGroup?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    size?: number;
  }
): Promise<BloodLevelHistoryResponse> {
  const queryParams = new URLSearchParams();

  if (params?.bloodGroup) {
    queryParams.set('bloodGroup', params.bloodGroup);
  }
  if (params?.fromDate) {
    queryParams.set('fromDate', params.fromDate);
  }
  if (params?.toDate) {
    queryParams.set('toDate', params.toDate);
  }
  if (params?.page !== undefined) {
    queryParams.set('page', String(params.page));
  }
  if (params?.size !== undefined) {
    queryParams.set('size', String(params.size));
  }

  const response = await apiClient.get<BloodLevelHistoryResponse>(
    `/rckik/${id}/blood-levels${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  );

  return response.data;
}
