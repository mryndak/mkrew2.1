import { Badge } from '@/components/ui/Badge';
import type { ScraperStatusProps } from '@/types/rckik';
import { SCRAPING_STATUS_CONFIG } from '@/types/rckik';

/**
 * ScraperStatus - komponent prezentujący status scrapera dla centrum RCKiK
 *
 * Pokazuje:
 * - Badge statusu (OK, DEGRADED, FAILED, UNKNOWN) z kolorami
 * - Timestamp ostatniego udanego scrapingu
 * - Komunikat błędu (jeśli dostępny)
 * - Link do zgłoszenia problemu (US-021)
 *
 * @example
 * ```tsx
 * <ScraperStatus
 *   lastSuccessfulScrape="2025-01-08T02:30:00"
 *   scrapingStatus="OK"
 * />
 * ```
 */
export function ScraperStatus({
  lastSuccessfulScrape,
  scrapingStatus,
  errorMessage,
}: ScraperStatusProps) {
  const config = SCRAPING_STATUS_CONFIG[scrapingStatus];

  // Format timestamp
  const formatTimestamp = (isoString: string | null) => {
    if (!isoString) return 'Brak danych';

    try {
      const date = new Date(isoString);
      return date.toLocaleString('pl-PL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Data niedostępna';
    }
  };

  // Calculate time since last scrape
  const getTimeSinceLastScrape = (isoString: string | null) => {
    if (!isoString) return null;

    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        return `${diffDays} ${diffDays === 1 ? 'dzień' : 'dni'} temu`;
      } else if (diffHours > 0) {
        return `${diffHours} ${diffHours === 1 ? 'godzinę' : 'godzin'} temu`;
      } else {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} ${diffMinutes === 1 ? 'minutę' : 'minut'} temu`;
      }
    } catch {
      return null;
    }
  };

  const timeSince = getTimeSinceLastScrape(lastSuccessfulScrape);

  // Get badge variant based on status
  const getBadgeVariant = (): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (scrapingStatus) {
      case 'OK':
        return 'success';
      case 'DEGRADED':
        return 'warning';
      case 'FAILED':
        return 'error';
      case 'UNKNOWN':
      default:
        return 'neutral';
    }
  };

  // Status icons
  const StatusIcon = () => {
    const iconClass = 'w-5 h-5';

    switch (scrapingStatus) {
      case 'OK':
        return (
          <svg
            className={`${iconClass} text-green-500`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'DEGRADED':
        return (
          <svg
            className={`${iconClass} text-yellow-500`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case 'FAILED':
        return (
          <svg
            className={`${iconClass} text-red-500`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className={`${iconClass} text-gray-400`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      {/* Title */}
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">Status scrapera</h2>

      {/* Status Badge */}
      <div className="flex items-center gap-3 mb-4">
        <StatusIcon />
        <Badge variant={getBadgeVariant()} size="medium">
          {config.label}
        </Badge>
      </div>

      {/* Last Successful Scrape */}
      {lastSuccessfulScrape && (
        <div className="space-y-2 mb-4">
          <div className="text-sm text-gray-700">
            <span className="font-medium">Ostatnie udane pobranie:</span>
          </div>
          <div className="text-sm text-gray-900">
            {formatTimestamp(lastSuccessfulScrape)}
            {timeSince && (
              <span className="text-gray-500 ml-2">({timeSince})</span>
            )}
          </div>
        </div>
      )}

      {/* Status Message */}
      <div className="mb-4">
        {scrapingStatus === 'OK' && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
            <span className="font-medium">Dane są aktualne.</span>
            <br />
            System automatycznie pobiera dane z oficjalnej strony centrum krwiodawstwa.
          </p>
        )}

        {scrapingStatus === 'DEGRADED' && (
          <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <span className="font-medium">Dane mogą być częściowo nieaktualne.</span>
            <br />
            System wykrył problemy podczas ostatniego pobierania danych. Dane mogą być
            niekompletne lub nieaktualne.
          </p>
        )}

        {scrapingStatus === 'FAILED' && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            <span className="font-medium">Błąd pobierania danych.</span>
            <br />
            System nie może pobrać aktualnych danych z oficjalnej strony centrum. Wyświetlane
            są ostatnie dostępne dane.
            {errorMessage && (
              <span className="block mt-2 text-xs">
                Szczegóły: {errorMessage}
              </span>
            )}
          </p>
        )}

        {scrapingStatus === 'UNKNOWN' && (
          <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <span className="font-medium">Status nieznany.</span>
            <br />
            Nie można określić statusu pobierania danych dla tego centrum.
          </p>
        )}
      </div>

      {/* Report Issue Link */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600 mb-3">
          Zauważyłeś problem z danymi? Pomóż nam ulepszyć system.
        </p>
        <a
          href={`/reports/new?type=data_issue`}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600
                     hover:text-blue-700 transition-colors duration-200"
        >
          {/* Flag icon */}
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
            />
          </svg>
          <span>Zgłoś problem z danymi</span>
          {/* External link icon */}
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
