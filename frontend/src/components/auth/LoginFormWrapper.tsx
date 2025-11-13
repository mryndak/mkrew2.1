import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import { LoginForm } from './LoginForm';
import type { LoginFormProps } from '@/types/auth';

/**
 * LoginFormWrapper - wraps LoginForm with Redux Provider
 * This is necessary because Astro islands need Provider and component in same island
 */
export function LoginFormWrapper(props: LoginFormProps) {
  return (
    <Provider store={store}>
      <LoginForm {...props} />
    </Provider>
  );
}
