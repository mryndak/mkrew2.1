/**
 * Error message constants
 * Centralized error messages for consistent user feedback
 * Makes it easier to implement i18n in the future
 */

/**
 * RCKiK-related error messages
 */
export const RCKIK_ERRORS = {
  NOT_FOUND: 'Centrum RCKiK nie zostało znalezione',
  NO_ACCESS: 'Brak dostępu do szczegółów centrum',
  FETCH_FAILED: 'Nie udało się pobrać szczegółów centrum',
} as const;

/**
 * Blood level history error messages
 */
export const HISTORY_ERRORS = {
  NOT_FOUND: 'Nie znaleziono historii dla tego centrum',
  NO_ACCESS: 'Brak dostępu do historii snapshotów',
  FETCH_FAILED: 'Nie udało się pobrać historii snapshotów',
} as const;

/**
 * Favorites error messages
 */
export const FAVORITES_ERRORS = {
  ADD_FAILED: 'Nie udało się dodać do ulubionych',
  REMOVE_FAILED: 'Nie udało się usunąć z ulubionych',
  FETCH_FAILED: 'Nie udało się pobrać listy ulubionych',
  NO_ACCESS: 'Musisz być zalogowany, aby dodać do ulubionych',
} as const;

/**
 * Generic HTTP error messages
 */
export const HTTP_ERRORS = {
  UNAUTHORIZED: 'Musisz być zalogowany, aby wykonać tę akcję',
  FORBIDDEN: 'Brak uprawnień do wykonania tej akcji',
  NOT_FOUND: 'Nie znaleziono żądanego zasobu',
  SERVER_ERROR: 'Błąd serwera. Spróbuj ponownie później',
  SERVICE_UNAVAILABLE: 'Serwis chwilowo niedostępny. Spróbuj ponownie za chwilę',
  NETWORK_ERROR: 'Brak połączenia z serwerem. Sprawdź połączenie internetowe',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  FAVORITE_ADDED: 'Dodano do ulubionych',
  FAVORITE_REMOVED: 'Usunięto z ulubionych',
  DATA_REFRESHED: 'Dane zostały odświeżone',
} as const;

/**
 * Generic error messages
 */
export const GENERIC_ERRORS = {
  UNKNOWN: 'Wystąpił nieznany błąd',
  TRY_AGAIN: 'Spróbuj ponownie',
  LOADING_FAILED: 'Nie udało się załadować danych',
} as const;

/**
 * Get error message based on HTTP status code
 *
 * @param status - HTTP status code
 * @param context - Context-specific error messages (optional)
 * @returns User-friendly error message
 *
 * @example
 * getErrorMessageByStatus(404, RCKIK_ERRORS)
 * // "Centrum RCKiK nie zostało znalezione"
 */
export const getErrorMessageByStatus = (
  status: number,
  context?: {
    NOT_FOUND?: string;
    NO_ACCESS?: string;
  }
): string => {
  switch (status) {
    case 401:
      return HTTP_ERRORS.UNAUTHORIZED;
    case 403:
      return context?.NO_ACCESS || HTTP_ERRORS.FORBIDDEN;
    case 404:
      return context?.NOT_FOUND || HTTP_ERRORS.NOT_FOUND;
    case 500:
      return HTTP_ERRORS.SERVER_ERROR;
    case 503:
      return HTTP_ERRORS.SERVICE_UNAVAILABLE;
    default:
      return GENERIC_ERRORS.UNKNOWN;
  }
};

/**
 * Enhanced error with cause chain
 *
 * @param message - User-friendly error message
 * @param originalError - Original error object
 * @returns Enhanced Error with cause
 *
 * @example
 * const error = createEnhancedError(
 *   RCKIK_ERRORS.FETCH_FAILED,
 *   apiError
 * );
 */
export const createEnhancedError = (message: string, originalError: any): Error => {
  const error = new Error(message);
  error.cause = originalError;
  return error;
};
