/**
 * EmptyState - Komponent wyświetlany gdy brak powiadomień
 *
 * Features:
 * - Różne komunikaty w zależności od kontekstu (wszystkie vs nieprzeczytane)
 * - Ikona dzwonka z designem
 * - Responsywny design
 * - Accessibility
 *
 * Props:
 * - message: string - główny komunikat (np. "Brak powiadomień")
 * - description?: string - opcjonalny opis szczegółowy
 *
 * @example
 * ```tsx
 * <EmptyState
 *   message="Brak powiadomień"
 *   description="Nie masz jeszcze żadnych powiadomień."
 * />
 * ```
 */

interface EmptyStateProps {
  message: string;
  description?: string;
}

export function EmptyState({ message, description }: EmptyStateProps) {
  return (
    <div
      className="bg-white rounded-lg shadow p-12 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        {/* Icon - Bell with slash */}
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>

        {/* Message */}
        <h3 className="text-xl font-semibold text-gray-900">{message}</h3>

        {/* Description (optional) */}
        {description && (
          <p className="text-gray-600 max-w-md">{description}</p>
        )}

        {/* Optional: Link to settings or other action */}
        {/* Uncomment if needed:
        <a
          href="/dashboard/profile"
          className="mt-4 text-red-600 hover:text-red-700 font-medium transition-colors"
        >
          Sprawdź ustawienia powiadomień →
        </a>
        */}
      </div>
    </div>
  );
}
