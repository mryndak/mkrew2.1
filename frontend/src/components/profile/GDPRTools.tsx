import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { exportUserData } from '@/lib/api/endpoints/user';
import type { GDPRToolsProps } from '@/types/profile';

/**
 * GDPRTools component
 *
 * Narzędzia związane z GDPR - eksport danych i usunięcie konta
 *
 * Features:
 * - Eksport danych użytkownika (JSON download)
 * - Usunięcie konta z password verification
 * - ConfirmModal z ostrzeżeniem i potwierdzeniem
 * - Post-deletion flow: logout + redirect
 *
 * @param userId - ID użytkownika
 * @param onExportData - Callback do eksportu danych
 * @param onDeleteAccount - Callback do usunięcia konta (with password)
 * @param onSuccess - Callback po sukcesie (dla toast)
 * @param onError - Callback po błędzie (dla toast)
 */
export const GDPRTools: React.FC<GDPRToolsProps> = ({
  userId,
  onExportData,
  onDeleteAccount,
  onSuccess,
  onError,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  /**
   * Handle data export
   */
  const handleExportData = async () => {
    setIsExporting(true);

    try {
      await onExportData();
      onSuccess('Twoje dane zostały wyeksportowane');
    } catch (error: any) {
      onError(error.message || 'Nie udało się wyeksportować danych');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Open delete account modal
   */
  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  /**
   * Close delete account modal
   */
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  /**
   * Handle account deletion
   */
  const handleDeleteAccount = async (data: any) => {
    const { password } = data;

    try {
      const response = await onDeleteAccount(password);

      // Success - rozpocznij flow wylogowania
      onSuccess('Twoje konto zostało usunięte');

      // Clear localStorage (token, etc.)
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      // Redirect to home page z parametrem account_deleted
      setTimeout(() => {
        window.location.href = '/?account_deleted=true';
      }, 1500);
    } catch (error: any) {
      // Error handling - modal pozostaje otwarty
      throw error; // Re-throw dla ConfirmModal (wyświetli błąd w modalu)
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Card header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Zarządzanie danymi</h2>
        <p className="mt-1 text-sm text-gray-600">
          Pobierz swoje dane lub usuń konto zgodnie z przepisami GDPR
        </p>
      </div>

      {/* Export Data Section */}
      <div className="mb-8 p-4 border border-gray-200 rounded-lg">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <svg
              className="w-8 h-8 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Eksport danych
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Pobierz wszystkie swoje dane w formacie JSON. Eksport zawiera Twój profil,
              preferencje powiadomień, historię donacji i ulubione RCKiK.
            </p>
            <Button
              variant="secondary"
              onClick={handleExportData}
              loading={isExporting}
              disabled={isExporting}
            >
              {isExporting ? 'Eksportowanie...' : 'Pobierz moje dane'}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Account Section */}
      <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <svg
              className="w-8 h-8 text-red-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-red-900 mb-2">
              Usunięcie konta
            </h3>
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded">
              <p className="text-sm text-red-800 font-medium mb-2">
                ⚠️ Ostrzeżenie: Ta akcja jest nieodwracalna!
              </p>
              <ul className="text-xs text-red-700 list-disc list-inside space-y-1">
                <li>Wszystkie Twoje dane osobowe zostaną trwale usunięte</li>
                <li>Historia donacji zostanie zanonimizowana</li>
                <li>Preferencje powiadomień zostaną usunięte</li>
                <li>Ulubione RCKiK zostaną usunięte</li>
                <li>Nie będzie możliwości odzyskania konta</li>
              </ul>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              Jeśli jesteś pewien, że chcesz trwale usunąć swoje konto, kliknij przycisk poniżej.
              Zostaniesz poproszony o potwierdzenie hasłem.
            </p>
            <button
              onClick={openDeleteModal}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Usuń konto
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Czy na pewno chcesz usunąć konto?"
        message="Ta akcja jest nieodwracalna. Wszystkie Twoje dane zostaną trwale usunięte. Wprowadź hasło, aby potwierdzić."
        confirmText="Usuń konto"
        cancelText="Anuluj"
        variant="danger"
        requirePassword={true}
        requireConfirmation={true}
        onConfirm={handleDeleteAccount}
        onCancel={closeDeleteModal}
      />
    </div>
  );
};
