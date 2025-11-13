import type { ImgHTMLAttributes } from 'react';

export type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge';
export type AvatarShape = 'circle' | 'square';

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string;
  alt?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  fallback?: string;
  className?: string;
}

/**
 * Avatar component - wyświetla zdjęcie profilowe użytkownika
 * Rozmiary: small (32px), medium (40px), large (56px), xlarge (96px)
 * Kształty: circle (okrągły), square (kwadratowy z rounded corners)
 * Wspiera fallback (inicjały) gdy brak src
 *
 * @example
 * ```tsx
 * <Avatar src="/avatar.jpg" alt="Jan Kowalski" />
 * <Avatar fallback="JK" size="large" />
 * <Avatar src="/avatar.jpg" shape="square" />
 * ```
 */
export function Avatar({
  src,
  alt = '',
  size = 'medium',
  shape = 'circle',
  fallback,
  className = '',
  ...props
}: AvatarProps) {
  // Mapowanie rozmiarów do klas Tailwind
  const sizeClasses: Record<AvatarSize, string> = {
    small: 'h-8 w-8 text-xs',
    medium: 'h-10 w-10 text-sm',
    large: 'h-14 w-14 text-base',
    xlarge: 'h-24 w-24 text-2xl',
  };

  // Mapowanie kształtów do klas Tailwind
  const shapeClasses: Record<AvatarShape, string> = {
    circle: 'rounded-full',
    square: 'rounded-lg',
  };

  const avatarClasses = [
    'inline-flex items-center justify-center overflow-hidden',
    'bg-gradient-to-br from-primary-400 to-primary-600',
    'text-white font-semibold',
    sizeClasses[size],
    shapeClasses[shape],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Jeśli jest src, wyświetl obrazek
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={avatarClasses}
        {...props}
      />
    );
  }

  // Jeśli brak src, wyświetl fallback (inicjały)
  return (
    <div className={avatarClasses} aria-label={alt}>
      <span>{fallback || getInitials(alt)}</span>
    </div>
  );
}

/**
 * Helper function - generuje inicjały z pełnej nazwy
 */
function getInitials(name: string): string {
  if (!name) return '?';

  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
