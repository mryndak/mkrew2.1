import { DonationTimelineItem } from './DonationTimelineItem';
import type { RecentDonationsTimelineProps } from '@/types/dashboard';

/**
 * RecentDonationsTimeline - Oś czasu ostatnich donacji na Dashboard
 *
 * Features:
 * - Wyświetla ostatnie 3 donacje w formie timeline
 * - Pionowa linia z punktami (dots)
 * - EmptyState jeśli brak donacji
 * - Link "Zobacz wszystkie" do /dashboard/donations
 * - Sortowanie: najnowsze pierwsze
 * - Opcjonalny onClick na item
 *
 * @example
 * ```tsx
 * <RecentDonationsTimeline
 *   donations={[...]}
 * />
 * ```
 */
export function RecentDonationsTimeline({
  donations,
}: RecentDonationsTimelineProps) {
  // Sort by donationDate descending (newest first)
  const sortedDonations = [...donations].sort(
    (a, b) =>
      new Date(b.donationDate).getTime() - new Date(a.donationDate).getTime()
  );

  const handleItemClick = (donationId: number) => {
    // Navigate to donations page with specific donation highlighted
    window.location.href = `/dashboard/donations#donation-${donationId}`;
  };

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <svg
            className="w-6 h-6 text-primary-600"
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
          Ostatnie donacje
        </h2>
        {donations.length > 0 && (
          <a
            href="/dashboard/donations"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            Zobacz wszystkie →
          </a>
        )}
      </div>

      {/* Timeline */}
      {sortedDonations.length > 0 ? (
        <div className="relative">
          {sortedDonations.slice(0, 3).map((donation, index) => (
            <DonationTimelineItem
              key={donation.id}
              donation={donation}
              onClick={handleItemClick}
            />
          ))}
        </div>
      ) : (
        // Empty state
        <div className="text-center py-8">
          <div className="mb-4 text-gray-300">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Brak zarejestrowanych donacji
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Zacznij prowadzić dziennik swoich donacji, aby śledzić swoją historię dawcy
            krwi
          </p>
          <a
            href="/dashboard/donations"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Dodaj pierwszą donację
          </a>
        </div>
      )}
    </section>
  );
}
