import { useState, useEffect } from 'react';
import { getCookie, deleteCookie } from '@/lib/utils/cookies';
import { getRoleFromToken } from '@/lib/auth/jwt';
import type { UserRole } from '@/types/auth';

/**
 * UserMenu - Client-side authentication menu
 * Dynamically shows login/register OR dashboard/logout based on auth state
 *
 * Features:
 * - Checks token in cookies/localStorage client-side
 * - Shows Login/Register for guests
 * - Shows Dashboard (USER) or Admin Panel (ADMIN) for authenticated users
 * - Handles logout (clears tokens and redirects)
 */
export function UserMenu() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      const cookieToken = getCookie('accessToken');
      const storageToken = localStorage.getItem('accessToken');
      const token = cookieToken || storageToken;

      setIsAuthenticated(!!token);

      // Get user role from token
      if (token) {
        const role = getRoleFromToken(token);
        setUserRole(role);
      } else {
        setUserRole(null);
      }

      setIsLoading(false);
    };

    checkAuth();

    // Listen for storage changes (logout in another tab)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    // Clear tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('rememberMe');

    // Clear cookies
    deleteCookie('accessToken');
    deleteCookie('refreshToken');

    // Redirect to home
    window.location.href = '/';
  };

  // Show nothing while loading (prevents flash)
  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-9 w-20 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-9 w-24 bg-gray-200 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  // Authenticated user menu
  if (isAuthenticated) {
    // Determine link and label based on role
    const dashboardHref = userRole === 'ADMIN' ? '/admin' : '/dashboard';
    const dashboardLabel = userRole === 'ADMIN' ? 'Panel administracyjny' : 'Dashboard';

    return (
      <div className="flex items-center gap-3">
        <a
          href={dashboardHref}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
        >
          {dashboardLabel}
        </a>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
        >
          Wyloguj
        </button>
      </div>
    );
  }

  // Guest user menu
  return (
    <div className="flex items-center gap-3">
      <a
        href="/login"
        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
      >
        Logowanie
      </a>
      <a
        href="/register"
        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
      >
        Rejestracja
      </a>
    </div>
  );
}
