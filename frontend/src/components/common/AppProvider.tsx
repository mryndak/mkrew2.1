import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import { ToastProvider } from '@/components/ui/Toast';
import { useApiErrorHandler } from '@/lib/hooks/useApiErrorHandler';

/**
 * AppErrorHandler component
 * Używa useApiErrorHandler hook do nasłuchiwania błędów API
 */
function AppErrorHandler({ children }: { children: React.ReactNode }) {
  useApiErrorHandler();
  return <>{children}</>;
}

/**
 * AppProvider component
 * Wraps React components z wszystkimi globalnymi providerami:
 * - Redux Provider
 * - Toast Provider (dla notyfikacji)
 * - API Error Handler (dla automatycznej obsługi błędów)
 *
 * Używaj tego zamiast ReduxProvider dla nowych komponentów
 *
 * @param children - Child components
 *
 * @example
 * // W Astro component:
 * <AppProvider client:only="react">
 *   <YourComponent client:load />
 * </AppProvider>
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ToastProvider position="top-right">
        <AppErrorHandler>
          {children}
        </AppErrorHandler>
      </ToastProvider>
    </Provider>
  );
}
