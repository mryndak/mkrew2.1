import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { BloodSnapshotResponse } from '@/lib/types/bloodSnapshots';

/**
 * Props dla ConfirmDeleteModal
 */
interface ConfirmDeleteModalProps {
  isOpen: boolean;
  snapshot: BloodSnapshotResponse | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

/**
 * ConfirmDeleteModal - Modal potwierdzenia usunięcia snapshotu
 *
 * Wyświetla:
 * - Ostrzeżenie o nieodwracalności operacji
 * - Szczegóły snapshotu do usunięcia (RCKiK, data, grupa krwi, poziom)
 * - Przyciski: Anuluj | Usuń
 *
 * Features:
 * - Disabled overlay/ESC podczas usuwania
 * - Loading state na przycisku "Usuń"
 * - Czerwony przycisk dla destructive action
 *
 * US-028: Ręczne wprowadzanie stanów krwi
 */
export function ConfirmDeleteModal({
  isOpen,
  snapshot,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Handler potwierdzenia usunięcia
   */
  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      // OnConfirm w parent komponencie zamyka modal po sukcesie
    } catch (error) {
      console.error('Delete error in modal:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!snapshot) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Potwierdź usunięcie"
      size="small"
      closeOnOverlayClick={!isDeleting}
      closeOnEsc={!isDeleting}
    >
      <div className="space-y-4">
        {/* Ostrzeżenie */}
        <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-md">
          <svg
            className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-red-800">Uwaga!</h4>
            <p className="text-sm text-red-700 mt-1">
              Ta operacja jest nieodwracalna i usunie snapshot na zawsze.
            </p>
          </div>
        </div>

        {/* Szczegóły snapshotu */}
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Snapshot który zostanie usunięty:
          </h4>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">RCKiK:</dt>
              <dd className="font-medium text-gray-900">
                {snapshot.rckikName} ({snapshot.rckikCode})
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Data:</dt>
              <dd className="font-medium text-gray-900">
                {new Date(snapshot.snapshotDate).toLocaleDateString('pl-PL')}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Grupa krwi:</dt>
              <dd className="font-medium text-gray-900">{snapshot.bloodGroup}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Poziom:</dt>
              <dd className="font-medium text-gray-900">{snapshot.levelPercentage.toFixed(2)}%</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Utworzono przez:</dt>
              <dd className="font-medium text-gray-900">{snapshot.createdBy || 'N/A'}</dd>
            </div>
          </dl>
        </div>

        {/* Pytanie potwierdzające */}
        <p className="text-sm text-gray-700">
          Czy na pewno chcesz usunąć ten snapshot?
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isDeleting && (
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
            )}
            {isDeleting ? 'Usuwanie...' : 'Usuń'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
