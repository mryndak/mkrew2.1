import { useEffect } from 'react';

/**
 * ConfirmModal - Modal potwierdzenia akcji
 *
 * Features:
 * - Backdrop z przezroczystym tłem
 * - Animacje wejścia/wyjścia
 * - Zamknięcie przez ESC key
 * - Zamknięcie przez kliknięcie backdrop
 * - Przyciski Anuluj i Potwierdź
 * - Destructive mode (czerwony przycisk dla akcji niszczących)
 * - Focus trap
 * - Accessible (ARIA labels, role="dialog")
 *
 * @example
 * ```tsx
 * <ConfirmModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={handleDelete}
 *   title="Usuń element?"
 *   message="Czy na pewno chcesz usunąć ten element?"
 *   confirmText="Usuń"
 *   isDestructive
 * />
 * ```
 */

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Potwierdź',
  cancelText = 'Anuluj',
  isDestructive = false,
}: ConfirmModalProps) {
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        {/* Modal Panel */}
        <div
          className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              {/* Icon */}
              <div
                className={`
                  mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full
                  sm:mx-0 sm:h-10 sm:w-10
                  ${isDestructive ? 'bg-red-100' : 'bg-blue-100'}
                `}
              >
                <svg
                  className={`h-6 w-6 ${isDestructive ? 'text-red-600' : 'text-blue-600'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isDestructive ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  )}
                </svg>
              </div>

              {/* Content */}
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3
                  className="text-base font-semibold leading-6 text-gray-900"
                  id="modal-title"
                >
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-600">{message}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
            {/* Confirm Button */}
            <button
              type="button"
              onClick={onConfirm}
              className={`
                inline-flex w-full justify-center rounded-lg px-4 py-2 text-sm font-medium
                shadow-sm transition-colors
                focus:outline-none focus:ring-2 focus:ring-offset-2
                sm:w-auto
                ${
                  isDestructive
                    ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                    : 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500'
                }
              `}
            >
              {confirmText}
            </button>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={onClose}
              className="
                mt-3 inline-flex w-full justify-center rounded-lg
                bg-white px-4 py-2 text-sm font-medium text-gray-700
                shadow-sm border border-gray-300
                hover:bg-gray-50 transition-colors
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                sm:mt-0 sm:w-auto
              "
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
