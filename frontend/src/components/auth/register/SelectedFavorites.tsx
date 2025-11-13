import React from 'react';
import type { RckikBasic } from '@/types/auth';

interface SelectedFavoritesProps {
  selectedRckiks: RckikBasic[];
  onRemove: (id: number) => void;
}

/**
 * SelectedFavorites component
 * Wyświetla wybrane ulubione RCKiK jako pills (badges) z przyciskiem remove (X)
 * Pozwala na szybkie usunięcie wybranego centrum
 *
 * @param selectedRckiks - Lista wybranych RCKiK
 * @param onRemove - Handler usunięcia RCKiK
 *
 * @example
 * <SelectedFavorites
 *   selectedRckiks={rckikList.filter(r => selectedIds.includes(r.id))}
 *   onRemove={handleRemove}
 * />
 */
export function SelectedFavorites({ selectedRckiks, onRemove }: SelectedFavoritesProps) {
  if (selectedRckiks.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-gray-700 mb-2">
        Wybrane centra ({selectedRckiks.length}):
      </p>
      <div className="flex flex-wrap gap-2">
        {selectedRckiks.map((rckik) => (
          <div
            key={rckik.id}
            className="inline-flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1.5 text-sm font-medium"
          >
            <span className="mr-1.5">
              {rckik.name}
            </span>
            <button
              type="button"
              onClick={() => onRemove(rckik.id)}
              className="inline-flex items-center justify-center w-4 h-4 ml-1 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full transition-colors"
              aria-label={`Usuń ${rckik.name}`}
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
