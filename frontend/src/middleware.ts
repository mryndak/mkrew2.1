import { defineMiddleware } from 'astro:middleware';
import { isAuthenticated, isAdmin } from './lib/auth/jwt';

/**
 * Astro Middleware - Auth & Authorization
 *
 * Handles authentication and authorization for protected routes:
 * - /dashboard/* - Requires authentication (any logged-in user)
 * - /admin/* - Requires authentication + ADMIN role
 * - /profile - Requires authentication
 *
 * Public routes (no auth required):
 * - /
 * - /login
 * - /register
 * - /verify-email
 * - /password-reset/*
 * - /rckik (public listing)
 * - /rckik/[id] (public details)
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;
  const pathname = url.pathname;

  // Get access token from cookies
  const accessToken = cookies.get('accessToken')?.value || null;

  // ===== Define protected route patterns =====

  const adminRoutes = ['/admin'];
  const authRoutes = ['/dashboard', '/profile'];

  // Check if current path matches protected routes
  const isAdminRoute = adminRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
  const isAuthRoute = authRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

  // ===== Admin routes - Require ADMIN role =====
  if (isAdminRoute) {
    // Check if user is authenticated
    if (!accessToken || !isAuthenticated(accessToken)) {
      // Not authenticated - redirect to login with return URL
      const returnUrl = encodeURIComponent(pathname + url.search);
      return redirect(`/login?redirect=${returnUrl}`);
    }

    // Check if user has ADMIN role
    if (!isAdmin(accessToken)) {
      // Authenticated but not ADMIN - redirect to unauthorized page
      console.warn(`Unauthorized access attempt to ${pathname} by non-admin user`);
      const message = encodeURIComponent('Nie masz uprawnień do dostępu do panelu administracyjnego. Panel dostępny tylko dla użytkowników z rolą ADMIN.');
      return redirect(`/unauthorized?message=${message}&returnUrl=/`);
    }

    // User is authenticated and has ADMIN role - proceed
    return next();
  }

  // ===== Auth routes - Require authentication (USER or ADMIN) =====
  if (isAuthRoute) {
    // Check if user is authenticated
    if (!accessToken || !isAuthenticated(accessToken)) {
      // Not authenticated - redirect to login with return URL
      const returnUrl = encodeURIComponent(pathname + url.search);
      return redirect(`/login?redirect=${returnUrl}`);
    }

    // User is authenticated - proceed
    return next();
  }

  // ===== Public routes - No auth required =====
  // Continue to the requested page
  return next();
});
