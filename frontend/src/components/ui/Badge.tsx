import type { ReactNode } from 'react';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type BadgeSize = 'small' | 'medium' | 'large';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

/**
 * Badge component - generyczny komponent do wyświetlania statusów i oznaczeń
 * Warianty: success (zielony), warning (żółty), error (czerwony), info (niebieski), neutral (szary)
 * Rozmiary: small, medium, large
 *
 * @example
 * ```tsx
 * <Badge variant="success">Aktywne</Badge>
 * <Badge variant="warning" icon={<AlertIcon />}>Ważne</Badge>
 * <Badge variant="error" size="small">Błąd</Badge>
 * ```
 */
export function Badge({
  variant = 'neutral',
  size = 'medium',
  children,
  className = '',
  icon,
}: BadgeProps) {
  // Mapowanie wariantów do klas Tailwind
  const variantClasses: Record<BadgeVariant, string> = {
    success: 'bg-green-100 text-green-800 border-green-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    error: 'bg-red-100 text-red-800 border-red-300',
    info: 'bg-blue-100 text-blue-800 border-blue-300',
    neutral: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  // Mapowanie rozmiarów do klas Tailwind
  const sizeClasses: Record<BadgeSize, string> = {
    small: 'px-2 py-0.5 text-xs',
    medium: 'px-2.5 py-1 text-sm',
    large: 'px-3 py-1.5 text-base',
  };

  const iconSizeClasses: Record<BadgeSize, string> = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-5 h-5',
  };

  const badgeClasses = [
    'inline-flex items-center gap-1.5 font-medium rounded-full border',
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={badgeClasses}>
      {icon && <span className={iconSizeClasses[size]}>{icon}</span>}
      {children}
    </span>
  );
}
