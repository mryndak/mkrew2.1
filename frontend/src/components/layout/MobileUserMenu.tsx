import { useState, useEffect } from 'react';
import { getCookie, deleteCookie } from '@/lib/utils/cookies';
import { getRoleFromToken } from '@/lib/auth/jwt';
import type { UserRole } from '@/types/auth';

/**
 * MobileUserMenu - Client-side authentication menu for mobile
 * Mobile version of UserMenu component
 * Shows different links based on user role (USER vs ADMIN)
 */
export function MobileUserMenu() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    // Get current path
    setCurrentPath(window.location.pathname);

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

    // Listen for storage changes
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    // Clear tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('rememberMe');
    deleteCookie('accessToken');
    deleteCookie('refreshToken');

    // Redirect to home
    window.location.href = '/';
  };

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <div className="h-10 bg-gray-200 animate-pulse rounded-lg"></div>
        <div className="h-10 bg-gray-200 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  // Authenticated user menu
  if (isAuthenticated) {
    // ADMIN menu - only admin panel and logout
    if (userRole === 'ADMIN') {
      const isAdmin = currentPath.startsWith('/admin');

      return (
        <div className="flex flex-col gap-2">
          <a
            href="/admin"
            className={`px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 ${
              isAdmin ? 'bg-primary-50 text-primary-600' : ''
            }`}
          >
            Panel administracyjny
          </a>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 text-left"
          >
            Wyloguj
          </button>
        </div>
      );
    }

    // USER menu - dashboard, notifications, and logout
    const isDashboard = currentPath.startsWith('/dashboard') && !currentPath.startsWith('/dashboard/notifications');
    const isNotifications = currentPath.startsWith('/dashboard/notifications');

    return (
      <div className="flex flex-col gap-2">
        <a
          href="/dashboard"
          className={`px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 ${
            isDashboard ? 'bg-primary-50 text-primary-600' : ''
          }`}
        >
          Dashboard
        </a>
        <a
          href="/dashboard/notifications"
          className={`px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 ${
            isNotifications ? 'bg-primary-50 text-primary-600' : ''
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Powiadomienia
        </a>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 text-left"
        >
          Wyloguj
        </button>
      </div>
    );
  }

  // Guest user menu
  return (
    <div className="flex flex-col gap-2">
      <a
        href="/login"
        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Logowanie
      </a>
      <a
        href="/register"
        className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
      >
        Rejestracja
      </a>
    </div>
  );
}
