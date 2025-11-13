/**
 * Date formatting utilities
 * Centralized date/time formatting for consistent display across the application
 */

/**
 * Format ISO timestamp to localized string with date and time
 *
 * @param isoString - ISO 8601 timestamp string
 * @returns Formatted string "DD.MM.YYYY, HH:MM" or fallback message
 *
 * @example
 * formatTimestamp('2025-01-15T10:30:00') // "15.01.2025, 10:30"
 * formatTimestamp(null) // "Data niedostępna"
 */
export const formatTimestamp = (isoString: string | null | undefined): string => {
  if (!isoString) {
    return 'Data niedostępna';
  }

  try {
    const date = new Date(isoString);
    return date.toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Data niedostępna';
  }
};

/**
 * Format ISO date to localized date string (without time)
 *
 * @param isoDate - ISO 8601 date string
 * @returns Formatted string "DD.MM.YYYY" or original input on error
 *
 * @example
 * formatDate('2025-01-15') // "15.01.2025"
 */
export const formatDate = (isoDate: string): string => {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
};

/**
 * Format ISO date to short format (DD.MM) for charts
 *
 * @param isoDate - ISO 8601 date string
 * @returns Formatted string "DD.MM" or original input on error
 *
 * @example
 * formatDateShort('2025-01-15') // "15.01"
 */
export const formatDateShort = (isoDate: string): string => {
  try {
    const [, month, day] = isoDate.split('-');
    return `${day}.${month}`;
  } catch {
    return isoDate;
  }
};

/**
 * Format ISO timestamp to full localized date string (no time)
 *
 * @param isoDate - ISO 8601 timestamp string
 * @returns Formatted string "DD miesiąc YYYY" or fallback
 *
 * @example
 * formatDateFull('2025-01-15T10:30:00') // "15 stycznia 2025"
 */
export const formatDateFull = (isoDate: string): string => {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return 'Data niedostępna';
  }
};

/**
 * Calculate relative time from now (e.g., "2 godziny temu")
 *
 * @param isoString - ISO 8601 timestamp string
 * @returns Relative time string in Polish or null if invalid
 *
 * @example
 * getTimeSinceLastUpdate('2025-01-15T08:00:00') // "2 godziny temu"
 * getTimeSinceLastUpdate('2025-01-14T10:00:00') // "1 dzień temu"
 */
export const getTimeSinceLastUpdate = (isoString: string | null): string | null => {
  if (!isoString) return null;

  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} ${diffDays === 1 ? 'dzień' : 'dni'} temu`;
    } else if (diffHours > 0) {
      return `${diffHours} ${diffHours === 1 ? 'godzinę' : 'godzin'} temu`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minutę' : 'minut'} temu`;
    } else {
      return 'Przed chwilą';
    }
  } catch {
    return null;
  }
};

/**
 * Format timestamp with relative time in parentheses
 *
 * @param isoString - ISO 8601 timestamp string
 * @returns Formatted string "DD.MM.YYYY, HH:MM (X czasu temu)" or just timestamp
 *
 * @example
 * formatTimestampWithRelative('2025-01-15T08:00:00')
 * // "15.01.2025, 08:00 (2 godziny temu)"
 */
export const formatTimestampWithRelative = (isoString: string | null | undefined): string => {
  const timestamp = formatTimestamp(isoString);
  if (!isoString || timestamp === 'Data niedostępna') {
    return timestamp;
  }

  const relative = getTimeSinceLastUpdate(isoString);
  return relative ? `${timestamp} (${relative})` : timestamp;
};
