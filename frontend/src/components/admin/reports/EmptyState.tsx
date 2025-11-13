import React from 'react';
import { Button } from '@/components/ui/Button';
import type { EmptyStateProps } from '@/lib/types/reports';

/**
 * EmptyState - Komponent wyświetlany gdy brak raportów
 *
 * Wyświetla różne komunikaty w zależności od kontekstu:
 * - Brak raportów w systemie (pierwsza wizyta)
 * - Brak raportów spełniających kryteria filtrów
 *
 * Funkcjonalności:
 * - Przycisk "Wyczyść filtry" (jeśli aktywne)
 * - Ikona ilustrująca pusty stan
 * - Przyjazny komunikat dla użytkownika
 */
export function EmptyState({ hasActiveFilters, onClearFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Icon */}
      <div className="mb-4">
        {hasActiveFilters ? (
          // Icon: Search with no results
          <svg
            className="w-16 h-16 text-gray-400"
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
          </svg>
        ) : (
          // Icon: Empty document/folder
          <svg
            className="w-16 h-16 text-gray-400"
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {hasActiveFilters ? 'Brak wyników wyszukiwania' : 'Brak raportów'}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-600 text-center max-w-md mb-6">
        {hasActiveFilters
          ? 'Nie znaleziono raportów spełniających wybrane kryteria. Spróbuj zmienić filtry lub wyczyść je, aby zobaczyć wszystkie raporty.'
          : 'Nie ma jeszcze żadnych raportów od użytkowników. Raporty pojawią się tutaj, gdy użytkownicy zgłoszą problemy z jakością danych.'}
      </p>

      {/* Action Button */}
      {hasActiveFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Wyczyść filtry
        </Button>
      )}

      {/* Additional info for no filters case */}
      {!hasActiveFilters && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">
                Czym są raporty użytkowników?
              </p>
              <p className="text-sm text-blue-800">
                Użytkownicy mogą zgłaszać nieprawidłowości w danych dotyczących stanów krwi
                w RCKiK. Tutaj możesz przeglądać te zgłoszenia i podejmować odpowiednie
                działania.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact EmptyState - Wariant dla mniejszych przestrzeni
 */
export function CompactEmptyState({ hasActiveFilters, onClearFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <svg
        className="w-12 h-12 text-gray-400 mb-3"
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
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <p className="text-sm text-gray-600 mb-3">
        {hasActiveFilters
          ? 'Brak wyników dla wybranych filtrów'
          : 'Brak raportów do wyświetlenia'}
      </p>
      {hasActiveFilters && (
        <Button variant="ghost" size="small" onClick={onClearFilters}>
          Wyczyść filtry
        </Button>
      )}
    </div>
  );
}
