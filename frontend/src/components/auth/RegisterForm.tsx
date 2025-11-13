import React from 'react';
import { useRegisterForm } from '@/lib/hooks/useRegisterForm';
import { ProgressBar } from './ProgressBar';
import { Step1Form } from './register/Step1Form';
import { Step2Form } from './register/Step2Form';
import { Step3Form } from './register/Step3Form';
import { ErrorMessage } from '@/components/forms/ErrorMessage';
import type { RegisterFormProps } from '@/types/auth';

/**
 * RegisterForm component
 * Główny multi-step form container (React island - client:only)
 * Zarządza stanem całego formularza, nawigacją między krokami, zapisem draftu, walidacją, i submitem do API
 * Używa custom hook useRegisterForm
 *
 * Features:
 * - Multi-step form (3 kroki)
 * - Email uniqueness check (async, debounced)
 * - Password strength validation
 * - Draft persistence to sessionStorage (bez haseł!)
 * - Per-step validation
 * - API error handling
 * - Redirect to verify-email-pending po sukcesie
 *
 * @param onSuccess - Callback po pomyślnej rejestracji (opcjonalny)
 *
 * @example
 * <RegisterForm client:only="react" />
 */
export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const {
    currentStep,
    completedSteps,
    formData,
    errors,
    isSubmitting,
    globalError,
    emailCheckStatus,
    updateField,
    goToNextStep,
    goToPreviousStep,
    submitForm,
  } = useRegisterForm();

  // Extract step-specific data
  const step1Data = {
    email: formData.email,
    password: formData.password,
    confirmPassword: formData.confirmPassword,
    consentAccepted: formData.consentAccepted,
    marketingConsent: formData.marketingConsent,
  };

  const step2Data = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    bloodGroup: formData.bloodGroup,
  };

  const step3Data = {
    favoriteRckikIds: formData.favoriteRckikIds,
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress bar */}
      <ProgressBar currentStep={currentStep} completedSteps={completedSteps} />

      {/* Global error message */}
      {globalError && (
        <div className="mb-6">
          <ErrorMessage message={globalError} type="error" />
        </div>
      )}

      {/* Form container */}
      <div className="bg-white shadow-lg rounded-lg p-6 sm:p-8">
        {/* Step 1: Email, Password, Consent */}
        {currentStep === 1 && (
          <Step1Form
            formData={step1Data}
            errors={errors}
            emailCheckStatus={emailCheckStatus}
            onChange={updateField}
            onNext={goToNextStep}
          />
        )}

        {/* Step 2: First Name, Last Name, Blood Group */}
        {currentStep === 2 && (
          <Step2Form
            formData={step2Data}
            errors={errors}
            onChange={updateField}
            onPrevious={goToPreviousStep}
            onNext={goToNextStep}
          />
        )}

        {/* Step 3: Favorite RCKiK */}
        {currentStep === 3 && (
          <Step3Form
            formData={step3Data}
            onChange={updateField}
            onPrevious={goToPreviousStep}
            onSkip={submitForm}
            onSubmit={submitForm}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

      {/* Draft save notice */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Twoje dane są automatycznie zapisywane w przeglądarce. Możesz wrócić do formularza później.
        </p>
      </div>
    </div>
  );
}
