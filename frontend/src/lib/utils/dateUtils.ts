/**
 * Date utility functions
 * Pomocnicze funkcje do formatowania dat i czasu
 */

/**
 * Formatuje timestamp do względnego czasu (np. "5 minut temu", "2 godziny temu")
 * @param timestamp - ISO 8601 timestamp string
 * @returns Sformatowany string z czasem względnym
 */
export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'Przed chwilą';
  } else if (diffMin < 60) {
    return `${diffMin} ${getPluralForm(diffMin, 'minuta', 'minuty', 'minut')} temu`;
  } else if (diffHour < 24) {
    return `${diffHour} ${getPluralForm(diffHour, 'godzina', 'godziny', 'godzin')} temu`;
  } else if (diffDay < 7) {
    return `${diffDay} ${getPluralForm(diffDay, 'dzień', 'dni', 'dni')} temu`;
  } else {
    // For dates older than 7 days, show full date
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}

/**
 * Formatuje timestamp do pełnej daty i czasu
 * @param timestamp - ISO 8601 timestamp string
 * @returns Sformatowany string z pełną datą
 */
export function formatFullDateTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Helper: Polish plural forms
 * @param count - liczba
 * @param one - forma dla 1 (np. "minuta")
 * @param few - forma dla 2-4 (np. "minuty")
 * @param many - forma dla 5+ (np. "minut")
 * @returns Poprawna forma
 */
function getPluralForm(count: number, one: string, few: string, many: string): string {
  if (count === 1) return one;
  if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
    return few;
  }
  return many;
}

/**
 * Sprawdza czy powiadomienie wygasło
 * @param expiresAt - ISO 8601 timestamp string lub null
 * @returns true jeśli wygasło, false w przeciwnym razie
 */
export function isNotificationExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;

  const now = new Date();
  const expiryDate = new Date(expiresAt);
  return expiryDate < now;
}
