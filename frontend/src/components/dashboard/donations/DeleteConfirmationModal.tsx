import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { DonationResponse } from '@/types/dashboard';

export interface DeleteConfirmationModalProps {
  isOpen: boolean;
  donation: DonationResponse | null;
  onClose: () => void;
  onConfirm: (donationId: number) => Promise<void>;
}

/**
 * DeleteConfirmationModal - Modal potwierdzenia usunięcia donacji
 *
 * Features:
 * - Wyświetlanie szczegółów donacji do usunięcia
 * - Ikona ostrzeżenia (czerwony trójkąt)
 * - Komunikat z informacją o nieodwracalności akcji
 * - Przyciski: Anuluj (secondary) i Usuń (danger)
 * - Loading state podczas usuwania
 * - Zamykanie po sukcesie lub błędzie (handled w parent)
 * - ESC key → zamknięcie bez akcji
 *
 * @example
 * ```tsx
 * <DeleteConfirmationModal
 *   isOpen={isOpen}
 *   donation={selectedDonation}
 *   onClose={handleClose}
 *   onConfirm={handleDelete}
 * />
 * ```
 */
export function DeleteConfirmationModal({
  isOpen,
  donation,
  onClose,
  onConfirm,
}: DeleteConfirmationModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Format date to readable format (DD.MM.YYYY)
   */
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  /**
   * Handle delete confirmation
   */
  const handleConfirm = async () => {
    if (!donation) return;

    try {
      setIsDeleting(true);
      await onConfirm(donation.id);
      // Modal closes in parent component after success
    } catch (error) {
      // Error is handled in parent component
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!donation) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="small"
      showCloseButton={!isDeleting}
      closeOnOverlayClick={!isDeleting}
      closeOnEsc={!isDeleting}
    >
      <div className="text-center">
        {/* Warning icon */}
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          <svg
            className="h-6 w-6 text-red-600"
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
        </div>

        {/* Title */}
        <h3 className="mt-4 text-lg font-medium text-gray-900">Potwierdź usunięcie</h3>

        {/* Message */}
        <div className="mt-3 text-sm text-gray-500 space-y-2">
          <p>
            Czy na pewno chcesz usunąć donację z dnia{' '}
            <span className="font-medium text-gray-900">
              {formatDate(donation.donationDate)}
            </span>{' '}
            w centrum{' '}
            <span className="font-medium text-gray-900">
              {donation.rckik.name} - {donation.rckik.city}
            </span>
            ?
          </p>
          <p className="font-medium text-red-600">
            Tej akcji nie można cofnąć.
          </p>
        </div>

        {/* Donation details */}
        <div className="mt-4 bg-gray-50 rounded-lg p-3 text-left">
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Typ:</dt>
              <dd className="text-gray-900 font-medium">
                {donation.donationType === 'FULL_BLOOD' && 'Krew pełna'}
                {donation.donationType === 'PLASMA' && 'Osocze'}
                {donation.donationType === 'PLATELETS' && 'Płytki krwi'}
                {donation.donationType === 'OTHER' && 'Inne'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Ilość:</dt>
              <dd className="text-gray-900 font-medium">{donation.quantityMl} ml</dd>
            </div>
            {donation.notes && (
              <div className="pt-2 border-t border-gray-200">
                <dt className="text-gray-500 mb-1">Notatki:</dt>
                <dd className="text-gray-700 text-xs">{donation.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1"
          >
            Anuluj
          </Button>
          <Button
            onClick={handleConfirm}
            loading={isDeleting}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
          >
            Usuń
          </Button>
        </div>
      </div>
    </Modal>
  );
}
