import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { WelcomeSection } from './WelcomeSection';
import { StatsCardsGrid } from './StatsCardsGrid';
import { FavoritesWidget } from './FavoritesWidget';
import { NotificationsWidget } from './NotificationsWidget';
import { RecentDonationsTimeline } from './RecentDonationsTimeline';
import { QuickActionsPanel } from './QuickActionsPanel';
import { MiniMap } from './MiniMap';

/**
 * DashboardContent - Główny komponent Dashboard
 *
 * Features:
 * - Integracja z useDashboardData hook
 * - Automatyczne pobieranie wszystkich danych Dashboard
 * - Loading states z skeletonami
 * - Error handling
 * - Kompozycja wszystkich sekcji Dashboard
 * - Responsywny layout
 *
 * Layout Structure:
 * - WelcomeSection (full width)
 * - StatsCardsGrid (full width, 4 cards)
 * - 2-column grid (desktop) / 1-column (mobile):
 *   - Left: RecentDonationsTimeline, QuickActionsPanel
 *   - Right: MiniMap, FavoritesWidget, NotificationsWidget
 *
 * @example
 * ```tsx
 * <DashboardContent />
 * ```
 */
export function DashboardContent() {
  const {
    user,
    statistics,
    recentDonations,
    favorites,
    notifications,
    unreadCount,
    nextDonationInfo,
    isLoading,
    error,
  } = useDashboardData();

  // Loading state
  if (isLoading && !user) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton />
      </div>
    );
  }

  // Error state
  if (error && !user) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-red-600 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Błąd ładowania danych
            </h3>
            <p className="text-sm text-gray-600 mb-3">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Odśwież stronę
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No user (shouldn't happen due to auth middleware)
  if (!user) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <p className="text-gray-600">Trwa ładowanie danych użytkownika...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section - Full width */}
      <WelcomeSection firstName={user.firstName} bloodGroup={user.bloodGroup} />

      {/* Stats Cards Grid - Full width */}
      <StatsCardsGrid
        statistics={
          statistics || {
            totalDonations: 0,
            totalQuantityMl: 0,
            lastDonationDate: null,
          }
        }
        nextDonationInfo={nextDonationInfo}
      />

      {/* Two-column layout for widgets (desktop) / single column (mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - 2/3 width on desktop */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Donations Timeline */}
          <RecentDonationsTimeline donations={recentDonations} />

          {/* Quick Actions Panel */}
          <QuickActionsPanel />
        </div>

        {/* Right column - 1/3 width on desktop */}
        <div className="lg:col-span-1 space-y-6">
          {/* Mini Map - Critical Blood Levels */}
          <MiniMap
            favorites={favorites}
            onCenterClick={(rckikId) => {
              window.location.href = `/rckik/${rckikId}`;
            }}
          />

          {/* Favorites Widget */}
          <FavoritesWidget favorites={favorites} />

          {/* Notifications Widget */}
          <NotificationsWidget
            notifications={notifications}
            unreadCount={unreadCount}
          />
        </div>
      </div>

      {/* Refresh indicator (subtle, bottom of page) */}
      {isLoading && user && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Aktualizowanie danych...</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * LoadingSkeleton - Skeleton dla ładowania Dashboard
 */
function LoadingSkeleton() {
  return (
    <>
      {/* Welcome section skeleton */}
      <div className="bg-gray-200 rounded-lg h-48 animate-pulse" />

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={`stat-skeleton-${i}`} className="bg-gray-200 rounded-lg h-32 animate-pulse" />
        ))}
      </div>

      {/* Widgets skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-200 rounded-lg h-96 animate-pulse" />
          <div className="bg-gray-200 rounded-lg h-48 animate-pulse" />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-200 rounded-lg h-96 animate-pulse" />
          <div className="bg-gray-200 rounded-lg h-64 animate-pulse" />
        </div>
      </div>
    </>
  );
}
