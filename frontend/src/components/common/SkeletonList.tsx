import type { SkeletonListProps } from '../../types/rckik';

/**
 * SkeletonList - placeholder podczas ładowania danych
 * - Grid container (jak RckikList)
 * - N× RckikCardSkeleton z shimmer animation
 * - Symuluje układ RckikCard
 */
export function SkeletonList({ count = 10 }: SkeletonListProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <RckikCardSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * RckikCardSkeleton - pojedynczy skeleton card
 * Shimmer animation gradient
 */
function RckikCardSkeleton() {
  return (
    <div className="card animate-pulse">
      {/* Header skeleton */}
      <div className="mb-4">
        {/* Title */}
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 shimmer" />

        {/* Code + City */}
        <div className="flex gap-2 mb-2">
          <div className="h-5 bg-gray-200 rounded w-24 shimmer" />
          <div className="h-5 bg-gray-200 rounded w-32 shimmer" />
        </div>
      </div>

      {/* Address skeleton */}
      <div className="h-4 bg-gray-200 rounded w-full mb-4 shimmer" />

      {/* Blood levels header */}
      <div className="h-4 bg-gray-200 rounded w-40 mb-2 shimmer" />

      {/* Blood levels grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 rounded shimmer" />
        ))}
      </div>

      {/* Footer skeleton */}
      <div className="pt-4 border-t border-gray-200">
        <div className="h-4 bg-gray-200 rounded w-48 shimmer" />
      </div>
    </div>
  );
}

// Add shimmer animation to global CSS or use inline style
// For now, we'll add it as a style tag in the component
// In production, this should be in global.css
