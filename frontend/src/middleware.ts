import { defineMiddleware } from 'astro:middleware';
import { isAuthenticated, isAdmin, isUser } from './lib/auth/jwt';

/**
 * Astro Middleware - Auth & Authorization
 *
 * Handles authentication and authorization for protected routes:
 * - /dashboard/* - Requires authentication + USER role (ADMIN cannot access)
 * - /admin/* - Requires authentication + ADMIN role (USER cannot access)
 * - /profile - Requires authentication (USER or ADMIN)
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
  const dashboardRoutes = ['/dashboard'];
  const profileRoutes = ['/profile'];

  // Check if current path matches protected routes
  const isAdminRoute = adminRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
  const isDashboardRoute = dashboardRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
  const isProfileRoute = profileRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

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

  // ===== Dashboard routes - Require USER role (block ADMIN) =====
  if (isDashboardRoute) {
    // Check if user is authenticated
    if (!accessToken || !isAuthenticated(accessToken)) {
      // Not authenticated - redirect to login with return URL
      const returnUrl = encodeURIComponent(pathname + url.search);
      return redirect(`/login?redirect=${returnUrl}`);
    }

    // Check if user has USER role (block ADMIN)
    if (!isUser(accessToken)) {
      // Authenticated but not USER (is ADMIN) - redirect to unauthorized page
      console.warn(`Unauthorized access attempt to ${pathname} by ADMIN user`);
      const message = encodeURIComponent('Administrator nie ma dostępu do panelu użytkownika. Twoje konto nie posiada funkcji: ulubione, powiadomienia, donacje.');
      return redirect(`/unauthorized?message=${message}&returnUrl=/admin`);
    }

    // User is authenticated and has USER role - proceed
    return next();
  }

  // ===== Profile routes - Require authentication (USER or ADMIN) =====
  if (isProfileRoute) {
    // Check if user is authenticated
    if (!accessToken || !isAuthenticated(accessToken)) {
      // Not authenticated - redirect to login with return URL
      const returnUrl = encodeURIComponent(pathname + url.search);
      return redirect(`/login?redirect=${returnUrl}`);
    }

    // User is authenticated (USER or ADMIN) - proceed
    // Note: ADMIN can access profile settings but with restrictions (no export/delete)
    return next();
  }

  // ===== Public routes - No auth required =====
  // Continue to the requested page
  return next();
});
