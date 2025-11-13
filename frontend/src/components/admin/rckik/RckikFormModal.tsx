import React, { useEffect, useRef } from 'react';
import { RckikForm } from './RckikForm';
import type { RckikFormModalProps } from '@/lib/types/admin';

/**
 * RckikFormModal - Modal wrapper dla formularza RCKiK
 *
 * Features:
 * - Modal overlay z blur backdrop
 * - Focus trap (zarządzanie focusem klawiatury)
 * - ESC key → close modal
 * - Click na backdrop → close modal (z potwierdzeniem jeśli są zmiany)
 * - Tryby: create i edit
 * - Responsywny design (max-width na desktop, full-width na mobile)
 *
 * US-019: Admin RCKiK Management
 */
export function RckikFormModal({
  isOpen,
  mode,
  initialData,
  onClose,
  onSubmit,
  isSubmitting,
}: RckikFormModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  /**
   * Handle ESC key
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isSubmitting, onClose]);

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
        // Delay focus to avoid conflicts with opening animation
        setTimeout(() => firstElement.focus(), 100);
      }
    }
  }, [isOpen]);

  /**
   * Prevent body scroll when modal is open
   */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  /**
   * Handle backdrop click
   */
  const handleBackdropClick = () => {
    if (!isSubmitting) {
      // TODO: Dodaj potwierdzenie jeśli są niezapisane zmiany
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2
              id="modal-title"
              className="text-xl font-semibold text-gray-900"
            >
              {mode === 'create' ? 'Dodaj nowe centrum RCKiK' : 'Edytuj centrum RCKiK'}
            </h2>
            {mode === 'edit' && initialData && (
              <p className="mt-1 text-sm text-gray-500">
                Edycja: {initialData.name} ({initialData.code})
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Zamknij modal"
          >
            <svg
              className="w-6 h-6"
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
          </button>
        </div>

        {/* Modal body - scrollable */}
        <div className="px-6 py-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <RckikForm
            mode={mode}
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onClose}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
