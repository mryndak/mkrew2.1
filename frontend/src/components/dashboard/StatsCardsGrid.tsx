import { StatsCard } from './StatsCard';
import type { StatsCardsGridProps } from '@/types/dashboard';
import { DONATION_TYPE_LABELS } from '@/types/dashboard';

/**
 * StatsCardsGrid - Grid z kartami statystyk Dashboard
 *
 * Features:
 * - 4 karty statystyk w responsive grid
 * - Liczba donacji
 * - Całkowita ilość oddanej krwi (ml)
 * - Ostatnia donacja (data)
 * - Następna możliwa donacja (data + countdown)
 * - Auto-obliczanie nextEligibleDate (56 dni od ostatniej)
 * - Ikony dla każdej karty
 *
 * @example
 * ```tsx
 * <StatsCardsGrid
 *   statistics={{
 *     totalDonations: 12,
 *     totalQuantityMl: 5400,
 *     lastDonationDate: '2025-01-05',
 *   }}
 *   nextDonationInfo={{
 *     date: '2025-03-02',
 *     daysRemaining: 28,
 *     isEligible: false,
 *   }}
 * />
 * ```
 */
export function StatsCardsGrid({
  statistics,
  nextDonationInfo,
}: StatsCardsGridProps) {
  const { totalDonations, totalQuantityMl, lastDonationDate } = statistics;
  const { date: nextDate, daysRemaining, isEligible } = nextDonationInfo;

  // Format last donation date
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Format next donation info
  const getNextDonationDisplay = () => {
    if (!lastDonationDate) {
      return {
        value: 'Teraz',
        info: 'Możesz oddać krew',
        color: 'text-green-600',
      };
    }

    if (isEligible) {
      return {
        value: 'Teraz',
        info: 'Możesz oddać krew już teraz!',
        color: 'text-green-600',
      };
    }

    return {
      value: daysRemaining !== null ? `${daysRemaining} dni` : '—',
      info: nextDate ? formatDate(nextDate) : 'Obliczanie...',
      color: 'text-gray-900',
    };
  };

  const nextDonationDisplay = getNextDonationDisplay();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {/* Card 1: Total Donations */}
      <StatsCard
        icon={
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        }
        label="Liczba donacji"
        value={totalDonations}
        additionalInfo="Wszystkie donacje"
        linkTo="/dashboard/donations"
      />

      {/* Card 2: Total Quantity */}
      <StatsCard
        icon={
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            />
          </svg>
        }
        label="Całkowita ilość"
        value={totalQuantityMl ? `${totalQuantityMl} ml` : '0 ml'}
        additionalInfo="Oddanej krwi"
        linkTo="/dashboard/donations"
      />

      {/* Card 3: Last Donation */}
      <StatsCard
        icon={
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        }
        label="Ostatnia donacja"
        value={lastDonationDate ? formatDate(lastDonationDate) : 'Brak danych'}
        additionalInfo={lastDonationDate ? 'Data ostatniej donacji' : 'Dodaj pierwszą donację'}
        linkTo="/dashboard/donations"
      />

      {/* Card 4: Next Eligible Donation */}
      <StatsCard
        icon={
          <svg
            className="w-6 h-6"
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
        }
        label="Następna możliwa"
        value={nextDonationDisplay.value}
        additionalInfo={nextDonationDisplay.info}
      />
    </div>
  );
}
