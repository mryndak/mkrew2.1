import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

export interface Toast {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  duration?: number;
  icon?: ReactNode;
}

export interface ToastOptions {
  variant?: ToastVariant;
  title?: string;
  duration?: number;
  icon?: ReactNode;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, options?: ToastOptions) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * ToastProvider - Provider dla systemu powiadomień toast
 * Umieszczaj w root aplikacji
 *
 * @example
 * ```tsx
 * <ToastProvider position="top-right">
 *   <App />
 * </ToastProvider>
 * ```
 */
export function ToastProvider({
  children,
  position = 'top-right',
  maxToasts = 5,
}: {
  children: ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = Math.random().toString(36).substr(2, 9);
      const toast: Toast = {
        id,
        variant: options.variant || 'info',
        title: options.title,
        message,
        duration: options.duration || 5000,
        icon: options.icon,
      };

      setToasts((prev) => {
        const newToasts = [...prev, toast];
        // Limit liczby toastów
        return newToasts.slice(-maxToasts);
      });

      // Auto-dismiss po określonym czasie
      if (toast.duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, toast.duration);
      }
    },
    [dismissToast, maxToasts]
  );

  const success = useCallback(
    (message: string, title?: string) => {
      showToast(message, { variant: 'success', title });
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string) => {
      showToast(message, { variant: 'error', title });
    },
    [showToast]
  );

  const warning = useCallback(
    (message: string, title?: string) => {
      showToast(message, { variant: 'warning', title });
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string) => {
      showToast(message, { variant: 'info', title });
    },
    [showToast]
  );

  const value: ToastContextValue = {
    toasts,
    showToast,
    success,
    error,
    warning,
    info,
    dismissToast,
  };

  // Mapowanie pozycji do klas Tailwind
  const positionClasses: Record<ToastPosition, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div
        className={`fixed z-50 flex flex-col gap-2 pointer-events-none ${positionClasses[position]}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * useToast - Hook do wyświetlania powiadomień toast
 *
 * @example
 * ```tsx
 * const toast = useToast();
 *
 * // Różne warianty
 * toast.success('Operacja zakończona pomyślnie');
 * toast.error('Wystąpił błąd');
 * toast.warning('Ostrzeżenie');
 * toast.info('Informacja');
 *
 * // Z tytułem
 * toast.success('Zapisano zmiany', 'Sukces!');
 *
 * // Custom options
 * toast.showToast('Wiadomość', {
 *   variant: 'success',
 *   title: 'Tytuł',
 *   duration: 3000,
 * });
 * ```
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

/**
 * ToastItem - pojedynczy toast notification
 */
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  // Mapowanie wariantów do klas Tailwind
  const variantClasses: Record<ToastVariant, string> = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    warning: 'bg-yellow-600 text-white',
    info: 'bg-blue-600 text-white',
  };

  // Domyślne ikony
  const defaultIcons: Record<ToastVariant, ReactNode> = {
    success: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  const displayedIcon = toast.icon || defaultIcons[toast.variant];

  return (
    <div
      className={`
        pointer-events-auto
        flex items-start gap-3 p-4 rounded-lg shadow-lg
        min-w-[300px] max-w-md
        animate-in slide-in-from-right duration-300
        ${variantClasses[toast.variant]}
      `}
      role="alert"
    >
      {/* Icon */}
      {displayedIcon && <div className="flex-shrink-0">{displayedIcon}</div>}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-semibold text-sm mb-0.5">{toast.title}</p>
        )}
        <p className="text-sm opacity-90">{toast.message}</p>
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
        aria-label="Zamknij powiadomienie"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
