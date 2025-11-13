import React from 'react';
import type { ConfirmDeleteModalProps } from '@/lib/types/admin';

/**
 * ConfirmDeleteModal - Modal potwierdzenia usunięcia/dezaktywacji centrum RCKiK
 *
 * Features:
 * - Wyświetla nazwę i kod centrum do usunięcia
 * - Ostrzeżenie o konsekwencjach (soft delete)
 * - Informacja o zachowaniu danych historycznych
 * - Przyciski: Potwierdź (czerwony), Anuluj
 * - Loading state podczas usuwania
 * - ESC key → close modal
 * - Click na backdrop → close modal
 *
 * US-019: Admin RCKiK Management
 */
export function ConfirmDeleteModal({
  rckik,
  isOpen,
  onConfirm,
  onCancel,
  isDeleting,
}: ConfirmDeleteModalProps) {
  /**
   * Handle ESC key
   */
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isDeleting, onCancel]);

  /**
   * Handle backdrop click
   */
  const handleBackdropClick = () => {
    if (!isDeleting) {
      onCancel();
    }
  };

  /**
   * Handle confirm button
   */
  const handleConfirm = async () => {
    await onConfirm();
  };

  if (!isOpen || !rckik) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex items-center justify-center mb-4">
          <svg
            className="w-12 h-12 text-red-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title */}
        <h3
          id="delete-modal-title"
          className="text-lg font-semibold text-gray-900 text-center mb-2"
        >
          Potwierdź dezaktywację
        </h3>

        {/* Message */}
        <div className="text-sm text-gray-600 text-center mb-6 space-y-2">
          <p>
            Czy na pewno chcesz dezaktywować centrum <strong>{rckik.name}</strong> ({rckik.code})?
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-left">
            <div className="flex">
              <svg
                className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-yellow-800">
                <p className="font-medium mb-1">Konsekwencje:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Centrum zostanie oznaczone jako nieaktywne</li>
                  <li>Użytkownicy nie będą widzieć tego centrum w aplikacji</li>
                  <li>Dane historyczne (snapshoty, raporty) zostaną zachowane</li>
                  <li>Możesz reaktywować centrum w przyszłości</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isDeleting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Dezaktywowanie...
              </>
            ) : (
              <>
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Potwierdź dezaktywację
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
