import React from 'react';
import { AppProvider } from '@/components/common/AppProvider';
import { LoginForm } from './LoginForm';
import type { LoginFormProps } from '@/types/auth';

/**
 * LoginFormWrapper - wraps LoginForm with AppProvider
 * This is necessary because Astro islands need Provider and component in same island
 * AppProvider includes Redux Provider, Toast notifications, and API error handling
 */
export function LoginFormWrapper(props: LoginFormProps) {
  return (
    <AppProvider>
      <LoginForm {...props} />
    </AppProvider>
  );
}
