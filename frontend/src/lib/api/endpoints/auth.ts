import { apiClient } from '../client';
import type { LoginRequest, LoginResponse } from '@/types/auth';

/**
 * Login user
 * Endpoint: POST /api/v1/auth/login
 *
 * @param data - LoginRequest with email and password
 * @returns Promise<LoginResponse> with access token and user data
 *
 * @throws AxiosError with status codes:
 * - 401: Invalid credentials
 * - 403: Email not verified
 * - 429: Too many attempts (rate limit)
 * - 500: Server error
 */
export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', data);
  return response.data;
}
