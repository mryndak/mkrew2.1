import { Tooltip } from '../ui/Tooltip';
import type { BloodLevelBadgeProps } from '../../types/rckik';
import { BLOOD_LEVEL_STATUS_CONFIG } from '../../types/rckik';

/**
 * BloodLevelBadge - wyświetla poziom konkretnej grupy krwi
 * Używa kolorów + ikon + tekstu dla accessibility (WCAG 2.1 AA)
 * Status: CRITICAL (<20%), IMPORTANT (20-49%), OK (>=50%)
 *
 * Rozszerzenia dla widoku szczegółów:
 * - Tooltip z timestampem lastUpdate
 * - Opcjonalny onClick handler (np. do filtrowania wykresu/tabeli)
 */
export function BloodLevelBadge({ bloodLevel, size = 'medium', onClick }: BloodLevelBadgeProps) {
  const config = BLOOD_LEVEL_STATUS_CONFIG[bloodLevel.levelStatus];

  // Format timestamp dla tooltip
  const formatTimestamp = (isoString: string) => {
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

  // Mapowanie rozmiarów
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base'
  };

  const iconSizeClasses = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-5 h-5'
  };

  // Ikony SVG dla różnych statusów
  const icons = {
    'alert-circle': (
      <svg
        className={iconSizeClasses[size]}
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
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    'alert-triangle': (
      <svg
        className={iconSizeClasses[size]}
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
    ),
    'check-circle': (
      <svg
        className={iconSizeClasses[size]}
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
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    )
  };

  const badgeClasses = [
    'inline-flex items-center gap-1.5 rounded-lg border font-medium',
    config.color,
    sizeClasses[size],
    onClick && 'cursor-pointer hover:opacity-80 transition-opacity duration-200',
  ]
    .filter(Boolean)
    .join(' ');

  // Tooltip content z timestampem
  const tooltipContent = (
    <div className="text-center">
      <div className="font-medium mb-1">
        {bloodLevel.bloodGroup}: {config.label}
      </div>
      <div className="text-xs opacity-90">
        Ostatnia aktualizacja:
        <br />
        {formatTimestamp(bloodLevel.lastUpdate)}
      </div>
    </div>
  );

  const badgeElement = (
    <div
      className={badgeClasses}
      onClick={onClick ? () => onClick(bloodLevel.bloodGroup) : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(bloodLevel.bloodGroup);
              }
            }
          : undefined
      }
      aria-label={
        onClick
          ? `${bloodLevel.bloodGroup} ${bloodLevel.levelPercentage.toFixed(1)}% - ${config.label}. Kliknij aby filtrować`
          : `${bloodLevel.bloodGroup} ${bloodLevel.levelPercentage.toFixed(1)}% - ${config.label}`
      }
    >
      {/* Status icon */}
      {icons[config.icon as keyof typeof icons]}

      {/* Blood group label */}
      <span className="font-semibold">{bloodLevel.bloodGroup}</span>

      {/* Percentage */}
      <span className="font-normal">{bloodLevel.levelPercentage.toFixed(1)}%</span>

      {/* Screen reader only text */}
      <span className="sr-only">{config.label}</span>
    </div>
  );

  // Wrap with Tooltip
  return <Tooltip content={tooltipContent}>{badgeElement}</Tooltip>;
}
