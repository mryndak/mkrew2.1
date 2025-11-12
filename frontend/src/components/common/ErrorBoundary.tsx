import { Component, type ReactNode } from 'react';
import { ErrorState } from './ErrorState';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary - React Error Boundary do catch'owania nieoczekiwanych błędów
 * - Catch errors w componentach React
 * - Fallback UI: ErrorState z reload button
 * - Logging błędów (console.error w dev, Sentry w prod)
 * - Można używać jako wrapper dla krytycznych komponentów
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state aby następny render pokazał fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log błędu do konsoli (development)
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // W production: wysłać do Sentry lub innego error tracking service
    // if (import.meta.env.PROD) {
    //   Sentry.captureException(error, {
    //     contexts: {
    //       react: {
    //         componentStack: errorInfo.componentStack
    //       }
    //     }
    //   });
    // }
  }

  handleRetry = () => {
    // Reset error state i spróbuj ponownie
    this.setState({ hasError: false, error: undefined });

    // Opcjonalnie: reload całej strony
    // window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI jeśli podany
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <ErrorState
          error={this.state.error || new Error('Nieoczekiwany błąd aplikacji')}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}
