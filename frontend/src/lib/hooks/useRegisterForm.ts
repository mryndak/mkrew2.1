import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import { registerUser, checkEmailUniqueness } from '@/lib/api/endpoints/auth';
import type {
  RegisterFormState,
  RegisterFormData,
  RegisterRequest,
  EmailCheckStatus,
  RegisterResponse,
} from '@/types/auth';
import {
  step1Schema,
  step2Schema,
  step3Schema,
  saveRegistrationDraft,
  loadRegistrationDraft,
  clearRegistrationDraft,
} from '@/types/auth';

const INITIAL_FORM_DATA: RegisterFormData = {
  email: '',
  password: '',
  confirmPassword: '',
  consentAccepted: false,
  marketingConsent: false,
  firstName: '',
  lastName: '',
  bloodGroup: null,
  favoriteRckikIds: [],
};

/**
 * Hook do zarządzania formularzem rejestracji (multi-step)
 * Obsługuje nawigację między krokami, walidację, draft persistence, email uniqueness check, i submit do API
 *
 * @returns Form state, handlers, navigation
 *
 * @example
 * const {
 *   currentStep,
 *   formData,
 *   errors,
 *   updateField,
 *   goToNextStep,
 *   goToPreviousStep,
 *   submitForm,
 *   isSubmitting
 * } = useRegisterForm();
 */
export function useRegisterForm() {
  // Load draft from sessionStorage on mount
  const [formData, setFormData] = useState<RegisterFormData>(() => {
    const draft = loadRegistrationDraft();
    return draft ? { ...INITIAL_FORM_DATA, ...draft } : INITIAL_FORM_DATA;
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [emailCheckStatus, setEmailCheckStatus] = useState<EmailCheckStatus>('idle');
  const [isEmailUnique, setIsEmailUnique] = useState<boolean | null>(null);

  // Debounced email for uniqueness check
  const debouncedEmail = useDebounce(formData.email, 500);

  // Check email uniqueness when debounced email changes
  useEffect(() => {
    if (!debouncedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(debouncedEmail)) {
      setEmailCheckStatus('idle');
      setIsEmailUnique(null);
      return;
    }

    const checkEmail = async () => {
      setEmailCheckStatus('checking');
      try {
        const isUnique = await checkEmailUniqueness(debouncedEmail);
        setIsEmailUnique(isUnique);
        setEmailCheckStatus(isUnique ? 'available' : 'taken');

        if (!isUnique) {
          setErrors((prev) => ({
            ...prev,
            email: 'Ten email jest już zarejestrowany',
          }));
        } else {
          setErrors((prev) => {
            const { email, ...rest } = prev;
            return rest;
          });
        }
      } catch (error) {
        setEmailCheckStatus('error');
        console.error('Email uniqueness check failed:', error);
      }
    };

    checkEmail();
  }, [debouncedEmail]);

  // Save draft to sessionStorage on formData change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveRegistrationDraft(formData);
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData]);

  // Update form field
  const updateField = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors((prev) => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // Validate current step
  const validateStep = useCallback((step: number): boolean => {
    setErrors({});

    try {
      if (step === 1) {
        step1Schema.parse({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          consentAccepted: formData.consentAccepted,
          marketingConsent: formData.marketingConsent,
        });

        // Check email uniqueness
        if (!isEmailUnique) {
          setErrors({ email: 'Ten email jest już zarejestrowany' });
          return false;
        }

        return true;
      }

      if (step === 2) {
        step2Schema.parse({
          firstName: formData.firstName,
          lastName: formData.lastName,
          bloodGroup: formData.bloodGroup,
        });
        return true;
      }

      if (step === 3) {
        step3Schema.parse({
          favoriteRckikIds: formData.favoriteRckikIds,
        });
        return true;
      }

      return false;
    } catch (error: any) {
      // Zod validation error
      if (error.errors) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          const field = err.path[0];
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  }, [formData, isEmailUnique]);

  // Go to next step
  const goToNextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
      setCurrentStep((prev) => Math.min(prev + 1, 3));
      setGlobalError(null);
    }
  }, [currentStep, validateStep]);

  // Go to previous step
  const goToPreviousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setGlobalError(null);
  }, []);

  // Submit form
  const submitForm = useCallback(async () => {
    // Validate all steps
    const step1Valid = validateStep(1);
    const step2Valid = validateStep(2);
    const step3Valid = validateStep(3);

    if (!step1Valid) {
      setCurrentStep(1);
      setGlobalError('Popraw błędy w pierwszym kroku');
      return;
    }

    if (!step2Valid) {
      setCurrentStep(2);
      setGlobalError('Popraw błędy w drugim kroku');
      return;
    }

    if (!step3Valid) {
      setCurrentStep(3);
      setGlobalError('Popraw błędy w trzecim kroku');
      return;
    }

    setIsSubmitting(true);
    setGlobalError(null);

    try {
      // Prepare request data
      const requestData: RegisterRequest = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        bloodGroup: formData.bloodGroup,
        favoriteRckikIds: formData.favoriteRckikIds,
        consentVersion: '1.0', // Current version
        consentAccepted: formData.consentAccepted,
      };

      // Call API
      const response = await registerUser(requestData);

      // Success - clear draft and redirect
      clearRegistrationDraft();

      // Redirect to verify-email-pending page
      window.location.href = '/verify-email-pending';
    } catch (error: any) {
      console.error('Registration failed:', error);

      // Handle API errors
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        if (status === 409) {
          // Email already exists
          setGlobalError('Ten email jest już zarejestrowany');
          setCurrentStep(1);
          setErrors({ email: 'Ten email jest już zarejestrowany' });
        } else if (status === 400 && errorData.details) {
          // Validation errors
          const fieldErrors: Record<string, string> = {};
          errorData.details.forEach((detail: any) => {
            fieldErrors[detail.field] = detail.message;
          });
          setErrors(fieldErrors);
          setGlobalError('Popraw błędy w formularzu');

          // Go to first step with error
          if (fieldErrors.email || fieldErrors.password) {
            setCurrentStep(1);
          } else if (fieldErrors.firstName || fieldErrors.lastName || fieldErrors.bloodGroup) {
            setCurrentStep(2);
          } else {
            setCurrentStep(3);
          }
        } else if (status === 429) {
          // Rate limit
          setGlobalError('Zbyt wiele prób rejestracji. Spróbuj ponownie za chwilę.');
        } else {
          // Other errors
          setGlobalError(errorData.message || 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie.');
        }
      } else if (error.request) {
        // Network error
        setGlobalError('Problem z połączeniem. Sprawdź swoje połączenie internetowe.');
      } else {
        // Unknown error
        setGlobalError('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateStep]);

  return {
    // State
    currentStep,
    completedSteps,
    formData,
    errors,
    isSubmitting,
    globalError,
    emailCheckStatus,
    isEmailUnique,
    // Handlers
    updateField,
    goToNextStep,
    goToPreviousStep,
    submitForm,
  };
}
