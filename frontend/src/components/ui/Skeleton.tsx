import type { CSSProperties } from 'react';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Skeleton component - Placeholder do wyświetlania podczas ładowania
 *
 * Features:
 * - Różne warianty: text, circular, rectangular
 * - Animacje: pulse, wave, none
 * - Konfigurowalna szerokość i wysokość
 * - Responsywny
 *
 * @example
 * ```tsx
 * <Skeleton variant="text" width="100%" />
 * <Skeleton variant="circular" width={40} height={40} />
 * <Skeleton variant="rectangular" width="100%" height={200} />
 * ```
 */
export function Skeleton({
  width = '100%',
  height,
  variant = 'text',
  className = '',
  animation = 'pulse',
}: SkeletonProps) {
  const style: CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  // Variant classes
  const variantClasses: Record<string, string> = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  // Animation classes
  const animationClasses: Record<string, string> = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const skeletonClasses = [
    'bg-gray-200',
    variantClasses[variant],
    animationClasses[animation],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={skeletonClasses} style={style} aria-hidden="true" />;
}

/**
 * SkeletonTable - Skeleton dla tabeli
 */
export function SkeletonTable({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex gap-4 mb-4 pb-4 border-b border-gray-200">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} width="100%" height={20} />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4 mb-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} width="100%" height={16} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonCard - Skeleton dla karty
 */
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton width="40%" height={16} />
          <Skeleton width="60%" height={32} />
          <Skeleton width="30%" height={12} />
        </div>
        <Skeleton variant="circular" width={48} height={48} />
      </div>
    </div>
  );
}
