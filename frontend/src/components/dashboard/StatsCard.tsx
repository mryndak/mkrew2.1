import type { StatsCardProps } from '@/types/dashboard';

/**
 * StatsCard - Pojedyncza karta statystyki Dashboard
 *
 * Features:
 * - Ikona (opcjonalna)
 * - Label (tytuł)
 * - Value (główna wartość)
 * - Additional info (podtytuł/dodatkowa informacja)
 * - Optional link/click handler
 * - Hover state
 *
 * @example
 * ```tsx
 * <StatsCard
 *   icon={<DropletIcon />}
 *   label="Liczba donacji"
 *   value={12}
 *   additionalInfo="W tym roku"
 *   linkTo="/dashboard/donations"
 * />
 * ```
 */
export function StatsCard({
  icon,
  label,
  value,
  additionalInfo,
  linkTo,
  onClick,
}: StatsCardProps) {
  const hasAction = !!linkTo || !!onClick;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (linkTo) {
      window.location.href = linkTo;
    }
  };

  const cardClasses = [
    'bg-white rounded-lg border border-gray-200 p-6 transition-all duration-200',
    hasAction
      ? 'cursor-pointer hover:border-primary-300 hover:shadow-md'
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  const CardWrapper = hasAction ? 'button' : 'div';

  return (
    <CardWrapper
      className={cardClasses}
      onClick={hasAction ? handleClick : undefined}
      type={hasAction ? 'button' : undefined}
      data-test-id="stats-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Label */}
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>

          {/* Value */}
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {value !== null && value !== undefined ? value : '—'}
          </p>

          {/* Additional Info */}
          {additionalInfo && (
            <p className="text-xs text-gray-500">{additionalInfo}</p>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div className="flex-shrink-0 ml-4">
            <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
              {icon}
            </div>
          </div>
        )}
      </div>

      {/* Hover indicator for clickable cards */}
      {hasAction && (
        <div className="mt-4 flex items-center text-primary-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Zobacz więcej
          <svg
            className="w-4 h-4 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      )}
    </CardWrapper>
  );
}
