import type { DonationStatisticsDto } from '@/types/dashboard';
import { StatsCard } from '../StatsCard';
import { SkeletonCard } from '@/components/ui/Skeleton';

export interface DonationsHeaderProps {
  statistics: DonationStatisticsDto | null;
  isLoading: boolean;
}

/**
 * DonationsHeader - Nagłówek widoku donacji ze statystykami
 *
 * Features:
 * - Tytuł strony "Moje donacje"
 * - 4 karty statystyk:
 *   1. Łączna liczba donacji
 *   2. Łączna ilość oddanej krwi (ml)
 *   3. Data ostatniej donacji
 *   4. Następna możliwa donacja (obliczony: ostatnia + 56 dni)
 * - Loading state z skeleton
 * - Responsywny grid (1 kolumna mobile, 2 tablet, 4 desktop)
 *
 * @example
 * ```tsx
 * <DonationsHeader statistics={statistics} isLoading={false} />
 * ```
 */
export function DonationsHeader({ statistics, isLoading }: DonationsHeaderProps) {
  /**
   * Oblicz następną możliwą datę donacji (ostatnia donacja + 56 dni)
   */
  const calculateNextEligibleDate = (lastDonationDate: string | null): string | null => {
    if (!lastDonationDate) return null;

    try {
      const lastDate = new Date(lastDonationDate);
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + 56);
      return nextDate.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error calculating next eligible date:', error);
      return null;
    }
  };

  /**
   * Formatuj datę do czytelnej formy (DD.MM.YYYY)
   */
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '—';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '—';
    }
  };

  /**
   * Oblicz dni do następnej możliwej donacji
   */
  const calculateDaysUntilEligible = (nextEligibleDate: string | null): number | null => {
    if (!nextEligibleDate) return null;

    try {
      const next = new Date(nextEligibleDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      next.setHours(0, 0, 0, 0);

      const diffTime = next.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays;
    } catch (error) {
      console.error('Error calculating days until eligible:', error);
      return null;
    }
  };

  // Przygotuj dane dla kart
  const totalDonations = statistics?.totalDonations ?? 0;
  const totalQuantityMl = statistics?.totalQuantityMl ?? 0;
  const lastDonationDate = statistics?.lastDonationDate ?? null;
  const nextEligibleDate = calculateNextEligibleDate(lastDonationDate);
  const daysUntilEligible = calculateDaysUntilEligible(nextEligibleDate);

  return (
    <div className="space-y-6" data-test-id="donations-header">
      {/* Tytuł */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Moje donacje</h1>
        <p className="mt-2 text-gray-600">
          Przeglądaj historię swoich donacji, śledź statystyki i eksportuj dane
        </p>
      </div>

      {/* Karty statystyk */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6" data-test-id="donations-stats-grid">
        {isLoading ? (
          // Loading state
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {/* Karta 1: Łączna liczba donacji */}
            <div data-test-id="donations-stats-total-count">
              <StatsCard
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
                label="Liczba donacji"
                value={totalDonations}
                additionalInfo="Łącznie oddanych"
              />
            </div>

            {/* Karta 2: Łączna ilość ml */}
            <div data-test-id="donations-stats-total-ml">
              <StatsCard
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                }
                label="Oddana krew"
                value={`${totalQuantityMl} ml`}
                additionalInfo="Łączna ilość"
              />
            </div>

            {/* Karta 3: Ostatnia donacja */}
            <div data-test-id="donations-stats-last-donation">
              <StatsCard
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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
                value={formatDate(lastDonationDate)}
                additionalInfo={lastDonationDate ? 'Data donacji' : 'Brak donacji'}
              />
            </div>

            {/* Karta 4: Następna możliwa donacja */}
            <div data-test-id="donations-stats-next-eligible">
              <StatsCard
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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
                value={
                  nextEligibleDate
                    ? daysUntilEligible !== null && daysUntilEligible > 0
                      ? `Za ${daysUntilEligible} ${daysUntilEligible === 1 ? 'dzień' : 'dni'}`
                      : 'Możesz oddać'
                    : '—'
                }
                additionalInfo={
                  nextEligibleDate
                    ? formatDate(nextEligibleDate)
                    : 'Dodaj pierwszą donację'
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
