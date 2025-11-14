import React from 'react';
import { AppProvider } from '@/components/common/AppProvider';
import { RegisterForm } from './RegisterForm';

/**
 * RegisterFormWrapper - wraps RegisterForm with AppProvider
 * This is necessary because Astro islands need Provider and component in same island
 * AppProvider includes Redux Provider, Toast notifications, and API error handling
 */
export function RegisterFormWrapper() {
  return (
    <AppProvider>
      <RegisterForm />
    </AppProvider>
  );
}
