import { RckikCard } from './RckikCard';
import { SkeletonList } from '../common/SkeletonList';
import { ErrorState } from '../common/ErrorState';
import { EmptyState } from '../common/EmptyState';
import type { RckikListProps } from '../../types/rckik';

/**
 * RckikList - główny container dla listy kart RCKiK
 * Conditional rendering:
 * - Loading: SkeletonList (10 placeholder cards)
 * - Error: ErrorState (z retry button)
 * - Empty: EmptyState (brak wyników, reset filters)
 * - Success: Grid z RckikCard × N
 */
export function RckikList({ data, loading, error }: RckikListProps) {
  // Loading state
  if (loading) {
    return <SkeletonList count={10} />;
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Empty state (no data or no results)
  if (!data || data.totalElements === 0) {
    return (
      <EmptyState
        title="Nie znaleziono centrów"
        message="Spróbuj zmienić filtry lub wyszukiwanie"
        onReset={() => {
          // Reset URL params and reload
          window.history.pushState({}, '', window.location.pathname);
          window.location.reload();
        }}
      />
    );
  }

  // Success state - render cards
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {data.content.map((rckik) => (
        <RckikCard key={rckik.id} rckik={rckik} />
      ))}
    </div>
  );
}
