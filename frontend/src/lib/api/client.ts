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
 * Dodaje token autoryzacyjny jeśli dostępny (dla przyszłych funkcji wymagających auth)
 */
apiClient.interceptors.request.use(
  (config) => {
    // Dla publicznych endpoints nie trzeba tokenu
    // W przyszłości można dodać logikę dla auth token
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
    // Rate limit handling
    if (error.response?.status === 429) {
      console.error('Rate limit exceeded. Please try again later.');
      // Można dodać toast notification
    }

    // Network error handling
    if (!error.response) {
      console.error('Network error - please check your connection');
    }

    return Promise.reject(error);
  }
);
