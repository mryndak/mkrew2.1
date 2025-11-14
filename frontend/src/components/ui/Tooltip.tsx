import { useState, useRef, useEffect, useId, type ReactNode } from 'react';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  content: ReactNode;
  position?: TooltipPosition;
  delay?: number; // delay w ms przed pokazaniem
  children: ReactNode;
  className?: string;
}

/**
 * Tooltip component - wyświetla dodatkowe informacje przy hover/focus
 * Pozycje: top, bottom, left, right
 * Wspiera keyboard navigation (focus) i screen readers (aria-describedby)
 *
 * @example
 * ```tsx
 * <Tooltip content="Ostatnia aktualizacja: 08.01.2025 02:30">
 *   <BloodLevelBadge bloodLevel={level} />
 * </Tooltip>
 * ```
 */
export function Tooltip({
  content,
  position = 'top',
  delay = 200,
  children,
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = useId();
  const timeoutRef = useRef<number>();

  const handleMouseEnter = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const handleFocus = () => {
    setIsVisible(true);
  };

  const handleBlur = () => {
    setIsVisible(false);
  };

  // Cleanup timeout przy unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Mapowanie pozycji do klas Tailwind
  const positionClasses: Record<TooltipPosition, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  // Klasy dla strzałki (arrow)
  const arrowClasses: Record<TooltipPosition, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {/* Trigger element */}
      <div aria-describedby={isVisible ? tooltipId : undefined}>
        {children}
      </div>

      {/* Tooltip */}
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={[
            'absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg',
            'whitespace-nowrap max-w-xs',
            positionClasses[position],
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {content}

          {/* Arrow */}
          <div
            className={[
              'absolute w-0 h-0',
              'border-4 border-transparent',
              arrowClasses[position],
            ].join(' ')}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Simple Tooltip - prostsza wersja bez strzałki i z mniejszą konfiguracją
 * Użyj gdy potrzebujesz prostego tooltipa bez dodatkowych funkcji
 *
 * @example
 * ```tsx
 * <SimpleTooltip content="Info text">
 *   <button>Hover me</button>
 * </SimpleTooltip>
 * ```
 */
export function SimpleTooltip({
  content,
  children,
}: {
  content: string;
  children: ReactNode;
}) {
  return (
    <div className="group relative inline-block">
      {children}
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block
                   px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap
                   pointer-events-none z-50"
        role="tooltip"
      >
        {content}
      </div>
    </div>
  );
}
