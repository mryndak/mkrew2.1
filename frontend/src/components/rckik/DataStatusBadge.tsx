import type { DataStatusBadgeProps } from '../../types/rckik';

/**
 * DataStatusBadge - informuje o statusie danych (PARTIAL/NO_DATA)
 * Wyświetlany tylko gdy dataStatus !== 'OK'
 * Zawiera warning icon + message + tooltip z lastUpdate
 */
export function DataStatusBadge({ dataStatus, lastUpdate }: DataStatusBadgeProps) {
  // Nie renderuj jeśli status jest OK
  if (dataStatus === 'OK') {
    return null;
  }

  // Mapowanie statusów do tekstów i kolorów
  const statusConfig = {
    PARTIAL: {
      label: 'Dane niekompletne',
      description: 'Niektóre grupy krwi mogą być niedostępne',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    },
    NO_DATA: {
      label: 'Brak danych',
      description: 'Dane dla tego centrum są obecnie niedostępne',
      color: 'bg-gray-100 text-gray-800 border-gray-300'
    }
  };

  const config = statusConfig[dataStatus];

  // Format last update timestamp
  const formattedDate = lastUpdate
    ? new Date(lastUpdate).toLocaleString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  const tooltipText = formattedDate
    ? `${config.description}. Ostatnia aktualizacja: ${formattedDate}`
    : config.description;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium ${config.color}`}
      title={tooltipText}
      role="status"
      aria-label={`${config.label}: ${config.description}`}
    >
      {/* Warning icon */}
      <svg
        className="w-4 h-4 flex-shrink-0"
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
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>

      {/* Status text */}
      <span>{config.label}</span>

      {/* Tooltip indicator (optional info icon) */}
      {lastUpdate && (
        <svg
          className="w-3.5 h-3.5 opacity-70"
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
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}
    </div>
  );
}
