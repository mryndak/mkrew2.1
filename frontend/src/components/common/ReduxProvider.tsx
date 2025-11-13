import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/lib/store';

/**
 * ReduxProvider component
 * Wraps React components with Redux Provider
 *必須 dla wszystkich React islands używających Redux
 *
 * @param children - Child components
 *
 * @example
 * // W Astro component:
 * <ReduxProvider client:only="react">
 *   <LoginForm client:load />
 * </ReduxProvider>
 */
export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
