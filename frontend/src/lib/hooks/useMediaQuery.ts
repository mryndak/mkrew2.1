import { useState, useEffect } from 'react';

/**
 * Hook do wykrywania media queries
 * Pozwala na responsive behavior w komponentach React
 *
 * @param query - CSS media query string
 * @returns boolean - true jeśli query matches
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Sprawdź czy window jest dostępny (SSR safety)
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia(query);

    // Ustaw początkową wartość
    setMatches(media.matches);

    // Listener dla zmian
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Dodaj listener (kompatybilność ze starszymi przeglądarkami)
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      // Fallback dla starszych przeglądarek
      media.addListener(listener);
    }

    // Cleanup
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Helper hook - wykrywa czy urządzenie jest mobile
 * Mobile: <= 768px
 */
export const useIsMobile = () => useMediaQuery('(max-width: 768px)');

/**
 * Helper hook - wykrywa czy urządzenie jest tablet
 * Tablet: 769px - 1024px
 */
export const useIsTablet = () => useMediaQuery('(min-width: 769px) and (max-width: 1024px)');

/**
 * Helper hook - wykrywa czy urządzenie jest desktop
 * Desktop: >= 1025px
 */
export const useIsDesktop = () => useMediaQuery('(min-width: 1025px)');
