import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import { RegisterForm } from './RegisterForm';

/**
 * RegisterFormWrapper - wraps RegisterForm with Redux Provider
 * This is necessary because Astro islands need Provider and component in same island
 */
export function RegisterFormWrapper() {
  return (
    <Provider store={store}>
      <RegisterForm />
    </Provider>
  );
}
