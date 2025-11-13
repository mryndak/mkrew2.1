import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from './Input';
import { Button } from './Button';
import type { ConfirmModalProps } from '@/types/profile';

/**
 * Delete account form schema (dla ConfirmModal)
 */
const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Hasło jest wymagane'),
  confirmation: z.boolean().refine((val) => val === true, {
    message: 'Musisz potwierdzić usunięcie konta',
  }),
});

type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>;

/**
 * ConfirmModal component
 *
 * Reużywalny modal do potwierdzania niebezpiecznych akcji (np. usunięcie konta)
 *
 * Features:
 * - Modal overlay z blur backdrop
 * - Focus trap (zarządzanie focusem klawiatury)
 * - ESC key → close modal
 * - Click na backdrop → close modal
 * - Conditional rendering: password input, checkbox
 * - Variants: danger, warning, info
 * - Accessibility: aria-labels, role="dialog"
 *
 * @param isOpen - Czy modal jest otwarty
 * @param title - Tytuł modalu
 * @param message - Treść wiadomości
 * @param confirmText - Tekst przycisku potwierdzenia (default: "Potwierdź")
 * @param cancelText - Tekst przycisku anulowania (default: "Anuluj")
 * @param variant - Wariant modalu: danger | warning | info
 * @param requirePassword - Czy wymagać pola hasła
 * @param requireConfirmation - Czy wymagać checkboxa potwierdzenia
 * @param onConfirm - Callback po potwierdzeniu (async)
 * @param onCancel - Callback po anulowaniu
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Potwierdź',
  cancelText = 'Anuluj',
  variant = 'info',
  requirePassword = false,
  requireConfirmation = false,
  onConfirm,
  onCancel,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // React Hook Form (tylko jeśli requirePassword lub requireConfirmation)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<DeleteAccountFormData>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      password: '',
      confirmation: false,
    },
  });

  const confirmationChecked = watch('confirmation');

  /**
   * Handle ESC key
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  /**
   * Focus trap - focus first focusable element when modal opens
   */
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      if (firstElement) {
        firstElement.focus();
      }
    }
  }, [isOpen]);

  /**
   * Reset form when modal closes
   */
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  /**
   * Submit handler
   */
  const onSubmit = async (data: DeleteAccountFormData) => {
    try {
      await onConfirm(data);
      onCancel(); // Close modal po sukcesie
    } catch (error: any) {
      // Handle password validation error from API
      if (error.response?.data?.error === 'INVALID_PASSWORD') {
        setError('password', {
          type: 'server',
          message: 'Niepoprawne hasło',
        });
      }
      // Nie zamykaj modalu przy błędzie - użytkownik może spróbować ponownie
    }
  };

  /**
   * Submit handler bez formularza (jeśli nie ma password/confirmation)
   */
  const handleSimpleConfirm = async () => {
    try {
      await onConfirm();
      onCancel();
    } catch (error) {
      // Error handled by parent component (onError callback)
    }
  };

  /**
   * Variant styles
   */
  const variantStyles = {
    danger: {
      icon: (
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
      ),
      buttonClass: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    },
    warning: {
      icon: (
        <svg
          className="w-12 h-12 text-yellow-500"
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
      ),
      buttonClass: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500',
    },
    info: {
      icon: (
        <svg
          className="w-12 h-12 text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    },
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header with icon */}
        <div className="flex items-center justify-center mb-4">
          {variantStyles[variant].icon}
        </div>

        {/* Title */}
        <h3 id="modal-title" className="text-lg font-semibold text-gray-900 text-center mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-sm text-gray-600 text-center mb-6">{message}</p>

        {/* Form (if requirePassword or requireConfirmation) */}
        {(requirePassword || requireConfirmation) ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Password input */}
            {requirePassword && (
              <Input
                type="password"
                label="Hasło"
                placeholder="Wprowadź swoje hasło"
                error={errors.password?.message}
                {...register('password')}
                autoComplete="current-password"
              />
            )}

            {/* Confirmation checkbox */}
            {requireConfirmation && (
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    id="confirmation"
                    className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    {...register('confirmation')}
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="confirmation" className="text-sm text-gray-700">
                    Rozumiem, że ta akcja jest nieodwracalna
                  </label>
                  {errors.confirmation && (
                    <p className="mt-1 text-xs text-red-600">{errors.confirmation.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 justify-end mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                {cancelText}
              </Button>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  (requireConfirmation && !confirmationChecked)
                }
                className={`px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant].buttonClass}`}
              >
                {isSubmitting ? 'Przetwarzanie...' : confirmText}
              </button>
            </div>
          </form>
        ) : (
          // Simple buttons (no form)
          <div className="flex gap-3 justify-end mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              {cancelText}
            </Button>
            <button
              type="button"
              onClick={handleSimpleConfirm}
              className={`px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantStyles[variant].buttonClass}`}
            >
              {confirmText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
