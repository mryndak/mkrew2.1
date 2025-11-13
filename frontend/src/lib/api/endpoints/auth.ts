import { apiClient } from '../client';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, VerifyEmailResponse } from '@/types/auth';

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

/**
 * Register new user
 * Endpoint: POST /api/v1/auth/register
 *
 * @param data - RegisterRequest with user data
 * @returns Promise<RegisterResponse> with user ID and email
 *
 * @throws AxiosError with status codes:
 * - 400: Validation error (invalid data)
 * - 409: Email already exists
 * - 429: Too many registration attempts (rate limit)
 * - 500: Server error
 */
export async function registerUser(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>('/auth/register', data);
  return response.data;
}

/**
 * Check email uniqueness
 * Endpoint: GET /api/v1/auth/check-email
 *
 * @param email - Email to check
 * @returns Promise<boolean> - true if email is available, false if taken
 *
 * @throws AxiosError on network error
 */
export async function checkEmailUniqueness(email: string): Promise<boolean> {
  const response = await apiClient.get<{ available: boolean }>(
    `/auth/check-email?email=${encodeURIComponent(email)}`
  );
  return response.data.available;
}

/**
 * Verify email with token
 * Endpoint: GET /api/v1/auth/verify-email
 *
 * @param token - Verification token from email link
 * @returns Promise<VerifyEmailResponse> with success message and email
 *
 * @throws AxiosError with status codes:
 * - 400: Invalid or expired token
 * - 404: Token not found
 * - 500: Server error
 */
export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  const response = await apiClient.get<VerifyEmailResponse>(
    `/auth/verify-email`,
    {
      params: { token },
      timeout: 15000, // 15 seconds timeout
    }
  );
  return response.data;
}

/**
 * Resend verification email
 * Endpoint: POST /api/v1/auth/resend-verification
 *
 * @param email - User email address
 * @returns Promise<{ message: string }> with success message
 *
 * @throws AxiosError with status codes:
 * - 400: Invalid email or already verified
 * - 429: Too many requests (rate limit)
 * - 500: Server error
 */
export async function resendVerificationEmail(email: string): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>(
    '/auth/resend-verification',
    { email }
  );
  return response.data;
}
