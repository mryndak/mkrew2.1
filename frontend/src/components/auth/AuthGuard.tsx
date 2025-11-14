import { useEffect, useState } from 'react';
import { getCookie } from '@/lib/utils/cookies';

/**
 * AuthGuard - Client-side authentication guard
 * Sprawdza czy użytkownik jest zalogowany (ma token w cookies lub localStorage)
 * Jeśli nie jest zalogowany - redirect do /login
 *
 * @param children - Content to render if authenticated
 * @param redirectUrl - Current page URL for redirect after login
 *
 * @example
 * ```tsx
 * <AuthGuard redirectUrl="/dashboard">
 *   <DashboardContent />
 * </AuthGuard>
 * ```
 */
interface AuthGuardProps {
  children: React.ReactNode;
  redirectUrl?: string;
}

export function AuthGuard({ children, redirectUrl }: AuthGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication
    const checkAuth = () => {
      // Check cookies first (set by authSlice after login)
      const cookieToken = getCookie('accessToken');

      // Fallback to localStorage (legacy or direct access)
      const storageToken = typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null;

      const hasToken = !!(cookieToken || storageToken);

      if (!hasToken) {
        // No token - redirect to login
        const currentPath = redirectUrl || window.location.pathname;
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        return;
      }

      // Token exists - user is authenticated
      setIsAuthenticated(true);
      setIsChecking(false);
    };

    checkAuth();
  }, [redirectUrl]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Sprawdzanie autoryzacji...</p>
        </div>
      </div>
    );
  }

  // User is authenticated - render children
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Redirecting (should not reach here, but just in case)
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-gray-600">Przekierowywanie do logowania...</p>
      </div>
    </div>
  );
}
