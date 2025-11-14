/**
 * Helper functions dla widoku Scraper
 * Formatowanie dat, czasu, progress bar, etc.
 */

/**
 * Formatuje timestamp na relative time ("5 minut temu", "2 godziny temu")
 */
export function formatRelativeTime(timestamp: string): string {
  // Sprawdź czy timestamp jest poprawny
  if (!timestamp || timestamp.trim() === '') {
    return 'Brak';
  }

  const date = new Date(timestamp);

  // Sprawdź czy data jest niepoprawna lub przed rokiem 2000 (Unix epoch, brak danych)
  if (isNaN(date.getTime()) || date.getTime() < 946684800000) {
    return 'Brak';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'przed chwilą';
  } else if (diffMin < 60) {
    return `${diffMin} ${formatPolishPlural(diffMin, 'minutę', 'minuty', 'minut')} temu`;
  } else if (diffHour < 24) {
    return `${diffHour} ${formatPolishPlural(diffHour, 'godzinę', 'godziny', 'godzin')} temu`;
  } else if (diffDay < 30) {
    return `${diffDay} ${formatPolishPlural(diffDay, 'dzień', 'dni', 'dni')} temu`;
  } else {
    return formatAbsoluteDate(timestamp);
  }
}

/**
 * Formatuje timestamp na absolute date ("8 stycznia 2025, 14:30")
 */
export function formatAbsoluteDate(timestamp: string): string {
  // Sprawdź czy timestamp jest poprawny
  if (!timestamp || timestamp.trim() === '') {
    return 'Brak';
  }

  const date = new Date(timestamp);

  // Sprawdź czy data jest niepoprawna lub przed rokiem 2000 (Unix epoch, brak danych)
  if (isNaN(date.getTime()) || date.getTime() < 946684800000) {
    return 'Brak';
  }

  return date.toLocaleString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatuje timestamp na krótką datę ("08.01.2025 14:30")
 */
export function formatShortDate(timestamp: string): string {
  // Sprawdź czy timestamp jest poprawny
  if (!timestamp || timestamp.trim() === '') {
    return 'Brak';
  }

  const date = new Date(timestamp);

  // Sprawdź czy data jest niepoprawna lub przed rokiem 2000 (Unix epoch, brak danych)
  if (isNaN(date.getTime()) || date.getTime() < 946684800000) {
    return 'Brak';
  }

  return date.toLocaleString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatuje duration w sekundach na czytelny format ("15m 30s", "2h 5m")
 */
export function formatDuration(durationSeconds: number | null): string {
  if (durationSeconds === null || durationSeconds === 0) {
    return '0s';
  }

  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds}s`);
  }

  return parts.join(' ');
}

/**
 * Oblicza success rate (procentowo)
 */
export function calculateSuccessRate(successful: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((successful / total) * 100);
}

/**
 * Zwraca kolor dla progress bar na podstawie success rate
 * >= 95%: green
 * 80-94%: yellow
 * < 80%: red
 */
export function getSuccessRateColor(successRate: number): {
  bg: string;
  text: string;
  label: string;
} {
  if (successRate >= 95) {
    return {
      bg: 'bg-green-500',
      text: 'text-green-700',
      label: 'Bardzo dobrze',
    };
  } else if (successRate >= 80) {
    return {
      bg: 'bg-yellow-500',
      text: 'text-yellow-700',
      label: 'Średnio',
    };
  } else {
    return {
      bg: 'bg-red-500',
      text: 'text-red-700',
      label: 'Słabo',
    };
  }
}

/**
 * Truncate długiego tekstu z "..."
 */
export function truncateText(text: string | null, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Formatuje polskie formy liczebnika
 * np: 1 minuta, 2 minuty, 5 minut
 */
export function formatPolishPlural(
  count: number,
  singularForm: string,
  pluralForm2to4: string,
  pluralForm5plus: string
): string {
  if (count === 1) {
    return singularForm;
  } else if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
    return pluralForm2to4;
  } else {
    return pluralForm5plus;
  }
}

/**
 * Sprawdza czy timestamp jest "stary" (starszy niż X minut)
 * Używane do ostrzeżeń o nieaktualnych danych
 */
export function isStaleData(timestamp: string, maxAgeMinutes: number = 5): boolean {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  return diffMin > maxAgeMinutes;
}

/**
 * Kopiuje tekst do schowka (clipboard)
 * Zwraca Promise<boolean> - true jeśli sukces
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback dla starszych przeglądarek
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      textArea.remove();
      return success;
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Parsuje comma-separated status string na array
 * "RUNNING,COMPLETED" => ["RUNNING", "COMPLETED"]
 */
export function parseStatusFilter(statusString?: string): string[] {
  if (!statusString || statusString.trim() === '') {
    return [];
  }
  return statusString.split(',').map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * Sprawdza czy run jest aktywny (RUNNING)
 */
export function isRunning(status: string): boolean {
  return status === 'RUNNING';
}

/**
 * Formatuje response time w ms na czytelny format
 * < 1000ms: "850 ms"
 * >= 1000ms: "1.2 s"
 */
export function formatResponseTime(timeMs: number): string {
  if (timeMs < 1000) {
    return `${timeMs} ms`;
  } else {
    return `${(timeMs / 1000).toFixed(1)} s`;
  }
}
