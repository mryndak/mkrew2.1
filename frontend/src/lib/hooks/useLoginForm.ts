import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch } from '@/lib/store';
import { login } from '@/lib/store/slices/authSlice';
import { loginUser } from '@/lib/api/endpoints/auth';
import { useRateLimit } from './useRateLimit';
import type {
  LoginFormSchema,
  LoginError,
} from '@/types/auth';
import { loginSchema, mapApiErrorToLoginError } from '@/types/auth';

/**
 * Hook do zarządzania formularzem logowania
 * Obsługuje walidację, rate limiting, submit do API, i Redux integration
 *
 * @param redirectUrl - URL do przekierowania po pomyślnym logowaniu (default: /dashboard)
 * @param onSuccess - Callback wywoływany po pomyślnym logowaniu (opcjonalny)
 * @returns Form handlers, state, errors
 *
 * @example
 * const {
 *   register,
 *   handleSubmit,
 *   errors,
 *   isSubmitting,
 *   globalError,
 *   isLocked,
 *   showCaptcha
 * } = useLoginForm('/dashboard');
 */
export function useLoginForm(
  redirectUrl: string = '/dashboard',
  onSuccess?: () => void
) {
  const dispatch = useAppDispatch();

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = useForm<LoginFormSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
      captchaToken: null,
    },
  });

  // Rate limit hook
  const {
    attemptCount,
    isLocked,
    lockedUntil,
    incrementAttempt,
    resetAttempts,
    checkLockStatus,
  } = useRateLimit();

  // Local state
  const [globalError, setGlobalError] = useState<LoginError | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(attemptCount >= 3);

  // Check lock status on mount and interval
  useEffect(() => {
    checkLockStatus();
    const interval = setInterval(checkLockStatus, 1000);
    return () => clearInterval(interval);
  }, [checkLockStatus]);

  // Update showCaptcha when attemptCount changes
  useEffect(() => {
    setShowCaptcha(attemptCount >= 3);
  }, [attemptCount]);

  /**
   * Submit handler
   * Validates form, calls API, handles errors, updates Redux
   */
  const onSubmit = async (data: LoginFormSchema) => {
    // Reset errors
    setGlobalError(null);

    // Check if locked
    if (isLocked) {
      setGlobalError({
        type: 'TOO_MANY_ATTEMPTS',
        message: 'Konto tymczasowo zablokowane. Spróbuj ponownie za kilka minut.',
      });
      return;
    }

    // Validate CAPTCHA if shown
    if (showCaptcha && !data.captchaToken) {
      setError('captchaToken', {
        type: 'required',
        message: 'Potwierdź, że nie jesteś robotem',
      });
      return;
    }

    try {
      // API call
      const response = await loginUser({
        email: data.email,
        password: data.password,
      });

      // Success: dispatch to Redux, reset rate limit
      dispatch(login(response));
      resetAttempts();

      // Optional: Store rememberMe preference (for longer session)
      if (data.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Redirect
      if (typeof window !== 'undefined') {
        window.location.href = redirectUrl;
      }
    } catch (error) {
      // Map error to LoginError
      const loginError = mapApiErrorToLoginError(error);
      setGlobalError(loginError);

      // Increment attempt count on auth errors (not network/server errors)
      if (
        loginError.type === 'INVALID_CREDENTIALS' ||
        loginError.type === 'EMAIL_NOT_VERIFIED'
      ) {
        incrementAttempt();
      }

      // Focus first field with error for accessibility
      // (React Hook Form handles this automatically)
    }
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    errors,
    isSubmitting,
    globalError,
    attemptCount,
    isLocked,
    lockedUntil,
    showCaptcha,
    setValue,
  };
}
