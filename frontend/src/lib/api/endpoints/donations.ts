import { apiClient } from '../client';
import type {
  DonationListResponse,
  DonationResponse,
  DonationStatisticsDto,
} from '@/types/dashboard';

/**
 * API endpoints dla zarządzania donacjami użytkownika
 * Wszystkie endpointy wymagają autoryzacji (Bearer token)
 */

/**
 * GET /api/v1/users/me/donations
 * Pobiera listę donacji użytkownika z paginacją i statystykami
 *
 * @param params - Parametry zapytania
 * @param params.page - Numer strony (zero-based, default: 0)
 * @param params.size - Rozmiar strony (default: 20)
 * @param params.sortOrder - Kolejność sortowania (ASC | DESC, default: DESC)
 * @returns Promise<DonationListResponse>
 * @throws 401 Unauthorized - Token invalid lub expired
 * @throws 500 Internal Server Error
 */
export async function getUserDonations(params?: {
  page?: number;
  size?: number;
  sortOrder?: 'ASC' | 'DESC';
}): Promise<DonationListResponse> {
  const response = await apiClient.get<DonationListResponse>('/users/me/donations', {
    params: {
      page: params?.page ?? 0,
      size: params?.size ?? 20,
      sortOrder: params?.sortOrder ?? 'DESC',
    },
  });
  return response.data;
}

/**
 * GET /api/v1/users/me/donations/statistics
 * Pobiera statystyki donacji użytkownika
 *
 * @returns Promise<DonationStatisticsDto>
 * @throws 401 Unauthorized - Token invalid
 * @throws 500 Internal Server Error
 */
export async function getDonationStatistics(): Promise<DonationStatisticsDto> {
  const response = await apiClient.get<DonationStatisticsDto>(
    '/users/me/donations/statistics'
  );
  return response.data;
}

/**
 * GET /api/v1/users/me/donations/recent
 * Pobiera ostatnie N donacji użytkownika
 * Alternative endpoint dla szybkiego pobrania tylko ostatnich donacji
 *
 * @param limit - Liczba donacji do pobrania (default: 3)
 * @returns Promise<DonationResponse[]>
 * @throws 401 Unauthorized - Token invalid
 * @throws 500 Internal Server Error
 */
export async function getRecentDonations(limit: number = 3): Promise<DonationResponse[]> {
  // Using the standard endpoint with size parameter
  const response = await getUserDonations({ page: 0, size: limit, sortOrder: 'DESC' });
  return response.donations;
}

/**
 * GET /api/v1/users/me/donations/{id}
 * Pobiera szczegóły pojedynczej donacji
 *
 * @param donationId - ID donacji
 * @returns Promise<DonationResponse>
 * @throws 401 Unauthorized - Token invalid
 * @throws 404 Not Found - Donacja nie istnieje lub nie należy do użytkownika
 * @throws 500 Internal Server Error
 */
export async function getDonationById(donationId: number): Promise<DonationResponse> {
  const response = await apiClient.get<DonationResponse>(`/users/me/donations/${donationId}`);
  return response.data;
}

/**
 * POST /api/v1/users/me/donations
 * Dodaje nową donację
 *
 * @param data - Dane nowej donacji
 * @returns Promise<DonationResponse>
 * @throws 400 Bad Request - Validation error
 * @throws 401 Unauthorized - Token invalid
 * @throws 500 Internal Server Error
 */
export async function createDonation(data: {
  rckikId: number;
  donationDate: string; // ISO date
  quantityMl: number;
  donationType: 'FULL_BLOOD' | 'PLASMA' | 'PLATELETS' | 'OTHER';
  notes?: string | null;
}): Promise<DonationResponse> {
  const response = await apiClient.post<DonationResponse>('/users/me/donations', data);
  return response.data;
}

/**
 * PATCH /api/v1/users/me/donations/{id}
 * Aktualizuje istniejącą donację
 *
 * @param donationId - ID donacji do aktualizacji
 * @param data - Dane do aktualizacji
 * @returns Promise<DonationResponse>
 * @throws 400 Bad Request - Validation error
 * @throws 401 Unauthorized - Token invalid
 * @throws 404 Not Found - Donacja nie istnieje
 * @throws 500 Internal Server Error
 */
export async function updateDonation(
  donationId: number,
  data: {
    rckikId?: number;
    donationDate?: string;
    quantityMl?: number;
    donationType?: 'FULL_BLOOD' | 'PLASMA' | 'PLATELETS' | 'OTHER';
    notes?: string | null;
  }
): Promise<DonationResponse> {
  const response = await apiClient.patch<DonationResponse>(
    `/users/me/donations/${donationId}`,
    data
  );
  return response.data;
}

/**
 * DELETE /api/v1/users/me/donations/{id}
 * Usuwa donację
 *
 * @param donationId - ID donacji do usunięcia
 * @returns Promise<void>
 * @throws 401 Unauthorized - Token invalid
 * @throws 404 Not Found - Donacja nie istnieje
 * @throws 500 Internal Server Error
 */
export async function deleteDonation(donationId: number): Promise<void> {
  await apiClient.delete(`/users/me/donations/${donationId}`);
}
