import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useProfile } from '@/lib/hooks/useProfile';
import { useNotificationPreferences } from '@/lib/hooks/useNotificationPreferences';
import { ProfileForm } from './ProfileForm';
import { NotificationPreferencesForm } from './NotificationPreferencesForm';
import { PasswordChangeSection } from './PasswordChangeSection';
import { GDPRTools } from './GDPRTools';
import { requestPasswordReset, exportUserData, deleteUserAccount } from '@/lib/api/endpoints/user';
import type { UpdateProfileRequest, UpdateNotificationPreferencesRequest } from '@/types/profile';

/**
 * ProfileView component
 *
 * Główny kontener widoku profilu użytkownika
 * Koordynuje komunikację między komponentami i zarządza stanem globalnym
 *
 * Features:
 * - Fetch profilu i preferencji przy montowaniu
 * - Integracja z Redux (useProfile, useNotificationPreferences)
 * - Toast notifications dla wszystkich akcji
 * - Responsive grid layout
 * - Error handling z fallback UI
 * - Loading states
 *
 * Layout:
 * - Mobile: 1 kolumna (stack)
 * - Desktop: 2 kolumny dla niektórych sekcji
 * - Max width: 1024px (centered)
 */
export const ProfileView: React.FC = () => {
  const {
    profile,
    isLoading: isProfileLoading,
    error: profileError,
    updateUserProfile,
  } = useProfile();

  const {
    preferences,
    isLoading: isPreferencesLoading,
    updateNotificationPreferences,
  } = useNotificationPreferences();

  /**
   * Show success toast
   */
  const showSuccess = (message: string) => {
    toast.success(message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  /**
   * Show error toast
   */
  const showError = (message: string) => {
    toast.error(message, {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  /**
   * Handle profile update
   */
  const handleProfileSave = async (data: UpdateProfileRequest) => {
    try {
      await updateUserProfile(data);
      // Success notification handled by SaveIndicator in ProfileForm
    } catch (error: any) {
      throw error; // Re-throw for ProfileForm to handle
    }
  };

  /**
   * Handle notification preferences update
   */
  const handlePreferencesSave = async (data: UpdateNotificationPreferencesRequest) => {
    try {
      await updateNotificationPreferences(data);
      // Success notification triggered by NotificationPreferencesForm
    } catch (error: any) {
      throw error; // Re-throw for NotificationPreferencesForm to handle
    }
  };

  /**
   * Handle password reset request
   */
  const handlePasswordReset = async (email: string) => {
    await requestPasswordReset(email);
  };

  /**
   * Handle data export
   */
  const handleDataExport = async () => {
    try {
      const blob = await exportUserData();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mkrew-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      throw error; // Re-throw for GDPRTools to handle
    }
  };

  /**
   * Handle account deletion
   */
  const handleAccountDeletion = async (password: string) => {
    const response = await deleteUserAccount(password);
    return response;
  };

  /**
   * Loading state
   */
  if (isProfileLoading || isPreferencesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Ładowanie profilu...</p>
        </div>
      </div>
    );
  }

  /**
   * Error state
   */
  if (profileError || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center mb-4">
            <svg
              className="w-16 h-16 text-red-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
            Nie udało się załadować profilu
          </h2>
          <p className="text-gray-600 text-center mb-6">
            {profileError || 'Wystąpił nieoczekiwany błąd podczas ładowania danych.'}
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Odśwież stronę
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Main view
   */
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Container */}
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mój profil</h1>
          <p className="mt-2 text-gray-600">
            Zarządzaj swoimi danymi osobowymi, preferencjami i ustawieniami konta
          </p>
        </div>

        {/* Main Content - Stack layout */}
        <div className="space-y-6">
          {/* Profile Form */}
          <ProfileForm
            initialData={profile}
            onSave={handleProfileSave}
            onError={showError}
          />

          {/* Notification Preferences Form */}
          {preferences && (
            <NotificationPreferencesForm
              initialData={preferences}
              onSave={handlePreferencesSave}
              onSuccess={showSuccess}
              onError={showError}
            />
          )}

          {/* Password Change Section */}
          <PasswordChangeSection
            userEmail={profile.email}
            onRequestReset={handlePasswordReset}
            onSuccess={showSuccess}
            onError={showError}
          />

          {/* GDPR Tools */}
          <GDPRTools
            userId={profile.id}
            onExportData={handleDataExport}
            onDeleteAccount={handleAccountDeletion}
            onSuccess={showSuccess}
            onError={showError}
          />
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Potrzebujesz pomocy?{' '}
            <a href="/kontakt" className="text-blue-600 hover:text-blue-700 hover:underline">
              Skontaktuj się z nami
            </a>
          </p>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};
