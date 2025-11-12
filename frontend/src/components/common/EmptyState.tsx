import { Button } from '../ui/Button';
import type { EmptyStateProps } from '../../types/rckik';

/**
 * EmptyState - wyświetlany gdy brak wyników wyszukiwania/filtrowania
 * - Ikona (search z X)
 * - Tytuł i message
 * - Reset button
 * - Link do browse all (opcjonalnie)
 */
export function EmptyState({
  title = 'Nie znaleziono centrów',
  message = 'Spróbuj zmienić filtry lub wyszukiwanie',
  onReset
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Empty icon */}
      <div className="mb-6 text-gray-300">
        <svg
          className="w-24 h-24 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
          />
        </svg>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        {title}
      </h3>

      {/* Message */}
      <p className="text-gray-600 mb-6 max-w-md">
        {message}
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="primary"
          onClick={onReset}
        >
          Resetuj filtry
        </Button>

        <Button
          variant="outline"
          onClick={() => window.location.href = '/rckik'}
        >
          Przeglądaj wszystkie centra
        </Button>
      </div>
    </div>
  );
}
