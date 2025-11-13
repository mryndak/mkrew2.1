import { Badge } from '@/components/ui/Badge';
import type { DonationTimelineItemProps } from '@/types/dashboard';
import { DONATION_TYPE_LABELS } from '@/types/dashboard';

/**
 * DonationTimelineItem - Element osi czasu dla pojedynczej donacji
 *
 * Features:
 * - Timeline dot (kółko po lewej stronie)
 * - Data donacji (sformatowana: "5 stycznia 2025")
 * - Nazwa centrum RCKiK
 * - Ilość oddanej krwi (ml)
 * - Typ donacji badge
 * - Ikona potwierdzenia jeśli confirmed
 * - Hover state
 * - Opcjonalny onClick handler
 *
 * @example
 * ```tsx
 * <DonationTimelineItem
 *   donation={donationData}
 *   onClick={(id) => console.log('Clicked:', id)}
 * />
 * ```
 */
export function DonationTimelineItem({
  donation,
  onClick,
}: DonationTimelineItemProps) {
  const { id, rckik, donationDate, quantityMl, donationType, confirmed } = donation;

  const isClickable = !!onClick;

  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.(id);
    }
  };

  // Format donation date
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Get donation type label
  const getDonationTypeLabel = (): string => {
    return DONATION_TYPE_LABELS[donationType] || donationType;
  };

  // Get donation type color
  const getDonationTypeBadgeVariant = (): 'success' | 'info' | 'warning' | 'neutral' => {
    switch (donationType) {
      case 'FULL_BLOOD':
        return 'success';
      case 'PLASMA':
        return 'info';
      case 'PLATELETS':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const itemClasses = [
    'flex gap-4 relative',
    isClickable ? 'cursor-pointer hover:bg-gray-50 rounded-lg transition-colors' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={itemClasses}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={
        isClickable
          ? `Donacja ${formatDate(donationDate)}, ${quantityMl} ml w ${rckik.name}. Kliknij aby zobaczyć szczegóły.`
          : undefined
      }
    >
      {/* Timeline dot */}
      <div className="relative flex flex-col items-center flex-shrink-0">
        <div
          className={`w-4 h-4 rounded-full border-4 ${
            confirmed
              ? 'bg-green-500 border-green-100'
              : 'bg-gray-300 border-gray-100'
          } z-10`}
        />
        {/* Vertical line */}
        <div className="w-0.5 flex-1 bg-gray-200 -mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        {/* Date */}
        <p className="text-sm font-semibold text-gray-900 mb-1">
          {formatDate(donationDate)}
        </p>

        {/* RCKiK name */}
        <p className="text-sm text-gray-700 mb-2 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {rckik.name}
          {rckik.city && (
            <span className="text-gray-500">• {rckik.city}</span>
          )}
        </p>

        {/* Quantity and type */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl font-bold text-primary-600">
            {quantityMl} ml
          </span>
          <Badge variant={getDonationTypeBadgeVariant()} size="small">
            {getDonationTypeLabel()}
          </Badge>
        </div>

        {/* Confirmation status */}
        {confirmed ? (
          <div className="flex items-center gap-1.5 text-xs text-green-700">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">Potwierdzona</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Oczekuje na potwierdzenie</span>
          </div>
        )}
      </div>
    </div>
  );
}
