import type { HTMLAttributes, ReactNode } from 'react';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'interactive';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'small' | 'medium' | 'large';
  className?: string;
  children: ReactNode;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

/**
 * Card component - kontener dla treści z różnymi wariantami
 * Warianty: default (cień), elevated (większy cień), outlined (border), interactive (hover effect)
 * Padding: none, small, medium, large
 *
 * @example
 * ```tsx
 * <Card>
 *   <Card.Header>Tytuł karty</Card.Header>
 *   <Card.Body>Treść karty</Card.Body>
 *   <Card.Footer>Footer</Card.Footer>
 * </Card>
 *
 * <Card variant="interactive" onClick={handleClick}>
 *   Klikalna karta
 * </Card>
 * ```
 */
export function Card({
  variant = 'default',
  padding = 'medium',
  className = '',
  children,
  ...props
}: CardProps) {
  // Mapowanie wariantów do klas Tailwind
  const variantClasses: Record<CardVariant, string> = {
    default: 'bg-white shadow-md',
    elevated: 'bg-white shadow-lg',
    outlined: 'bg-white border border-gray-200',
    interactive:
      'bg-white shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer',
  };

  // Mapowanie padding do klas Tailwind
  const paddingClasses: Record<string, string> = {
    none: '',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
  };

  const cardClasses = [
    'rounded-lg',
    variantClasses[variant],
    paddingClasses[padding],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
}

/**
 * Card.Header - nagłówek karty
 */
export function CardHeader({ children, className = '', ...props }: CardHeaderProps) {
  return (
    <div className={`pb-4 border-b border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * Card.Body - główna treść karty
 */
export function CardBody({ children, className = '', ...props }: CardBodyProps) {
  return (
    <div className={`py-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * Card.Footer - stopka karty
 */
export function CardFooter({ children, className = '', ...props }: CardFooterProps) {
  return (
    <div className={`pt-4 border-t border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  );
}

// Export jako subkomponenty
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
