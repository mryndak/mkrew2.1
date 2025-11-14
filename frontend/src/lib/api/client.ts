import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  MAX_RETRIES: 5,
  RETRY_DELAY_MS: 1000, // 1 second
  RATE_LIMIT_RETRY_DELAY_MS: 2000, // 2 seconds for rate limiting
  NETWORK_ERROR_CODES: ['ECONNABORTED', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'ERR_NETWORK'],
};

/**
 * Interface for tracking retry attempts
 */
interface RetryConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
}

/**
 * Helper: Check if error is retryable
 */
function isRetryableError(error: AxiosError): boolean {
  // Network errors (backend not available)
  if (!error.response && error.code && RETRY_CONFIG.NETWORK_ERROR_CODES.includes(error.code)) {
    return true;
  }

  // Rate limiting (429)
  if (error.response?.status === 429) {
    return true;
  }

  // Service unavailable (503)
  if (error.response?.status === 503) {
    return true;
  }

  return false;
}

/**
 * Helper: Get retry delay based on error type
 */
function getRetryDelay(error: AxiosError): number {
  // Rate limiting - use longer delay
  if (error.response?.status === 429) {
    // Check if backend provides Retry-After header
    const retryAfter = error.response.headers['retry-after'];
    if (retryAfter) {
      const delay = parseInt(retryAfter, 10) * 1000;
      return !isNaN(delay) ? delay : RETRY_CONFIG.RATE_LIMIT_RETRY_DELAY_MS;
    }
    return RETRY_CONFIG.RATE_LIMIT_RETRY_DELAY_MS;
  }

  // Default delay for network errors
  return RETRY_CONFIG.RETRY_DELAY_MS;
}

/**
 * Helper: Sleep for specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Axios client dla komunikacji z backend API
 * Bazowy URL pobierany z zmiennej środowiskowej PUBLIC_API_BASE_URL
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor
 * Dodaje token autoryzacyjny jeśli dostępny
 */
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage (or use httpOnly cookies in production)
    const token = localStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * Obsługuje globalne błędy, rate limiting i retry logic
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig;

    // Log error in development only
    if (import.meta.env.DEV) {
      console.error('API Error:', {
        status: error.response?.status,
        message: error.response?.data || error.message,
        url: config?.url,
        retryCount: config?.__retryCount || 0,
      });
    }

    // Do NOT log passwords or sensitive data
    // Remove sensitive data from error logs
    if (config?.data) {
      try {
        const data = JSON.parse(config.data);
        if (data.password) {
          delete data.password;
        }
      } catch {
        // Ignore parsing errors
      }
    }

    // Check if we should retry
    if (!config || !isRetryableError(error)) {
      return Promise.reject(error);
    }

    // Initialize retry count
    config.__retryCount = config.__retryCount || 0;

    // Check if max retries reached
    if (config.__retryCount >= RETRY_CONFIG.MAX_RETRIES) {
      // Emit custom event for max retries reached
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('api-max-retries-reached', {
          detail: {
            error,
            url: config.url,
            retryCount: config.__retryCount,
          }
        }));
      }

      return Promise.reject(error);
    }

    // Increment retry count
    config.__retryCount += 1;

    // Get retry delay
    const delay = getRetryDelay(error);

    // Log retry attempt
    if (import.meta.env.DEV) {
      console.log(
        `Retrying request to ${config.url} (attempt ${config.__retryCount}/${RETRY_CONFIG.MAX_RETRIES}) after ${delay}ms`
      );
    }

    // Wait before retrying
    await sleep(delay);

    // Retry the request
    return apiClient.request(config);
  }
);
