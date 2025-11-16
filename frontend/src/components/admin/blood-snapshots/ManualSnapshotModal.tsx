import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ManualSnapshotForm } from './ManualSnapshotForm';
import type {
  BloodSnapshotResponse,
  CreateBloodSnapshotRequest,
  UpdateBloodSnapshotRequest,
  ModalMode,
} from '@/lib/types/bloodSnapshots';

/**
 * Props dla ManualSnapshotModal
 */
interface ManualSnapshotModalProps {
  isOpen: boolean;
  mode: ModalMode;
  initialData?: BloodSnapshotResponse;
  onClose: () => void;
  onSubmit: (data: CreateBloodSnapshotRequest | UpdateBloodSnapshotRequest) => Promise<void>;
}

/**
 * ManualSnapshotModal - Modal z formularzem dodawania/edycji snapshotu
 *
 * Używa:
 * - Modal (UI component) dla overlay i layoutu
 * - ManualSnapshotForm dla formularza z walidacją
 *
 * Features:
 * - ESC key → zamknij modal
 * - Overlay click → zamknij modal
 * - Focus trap
 * - Różne tytuły dla create/edit mode
 *
 * US-028: Ręczne wprowadzanie stanów krwi
 */
export function ManualSnapshotModal({
  isOpen,
  mode,
  initialData,
  onClose,
  onSubmit,
}: ManualSnapshotModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handler submitu formularza
   */
  const handleSubmit = async (data: CreateBloodSnapshotRequest | UpdateBloodSnapshotRequest) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      // OnSubmit w parent komponencie zamyka modal po sukcesie
    } catch (error) {
      // Błędy obsługiwane w parent komponencie przez toast
      console.error('Submit error in modal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Tytuł modalu zależny od trybu
   */
  const modalTitle = mode === 'create' ? 'Dodaj nowy snapshot' : 'Edytuj snapshot';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="medium"
      closeOnOverlayClick={!isSubmitting} // Nie zamykaj podczas submitu
      closeOnEsc={!isSubmitting} // Nie zamykaj podczas submitu
    >
      <ManualSnapshotForm
        mode={mode}
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
      />
    </Modal>
  );
}
