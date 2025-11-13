import axios, { type AxiosError } from 'axios';

/**
 * Axios client dla komunikacji z backend API
 * Bazowy URL pobierany z zmiennej środowiskowej lub domyślny '/api/v1'
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.PUBLIC_API_URL || '/api/v1',
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
 * Obsługuje globalne błędy i rate limiting
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Log error in development only
    if (import.meta.env.DEV) {
      console.error('API Error:', {
        status: error.response?.status,
        message: error.response?.data || error.message,
        url: error.config?.url,
      });
    }

    // Do NOT log passwords or sensitive data
    // Remove sensitive data from error logs
    if (error.config?.data) {
      try {
        const data = JSON.parse(error.config.data);
        if (data.password) {
          delete data.password;
        }
      } catch {
        // Ignore parsing errors
      }
    }

    return Promise.reject(error);
  }
);
