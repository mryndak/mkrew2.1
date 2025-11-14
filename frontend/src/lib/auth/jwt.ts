import type { UserRole } from '@/types/auth';

/**
 * JWT Payload interface
 * Matches backend JWT structure
 */
export interface JWTPayload {
  sub: string; // User ID
  email: string;
  role: UserRole; // 'USER' | 'ADMIN'
  iat: number; // Issued at (timestamp)
  exp: number; // Expiration (timestamp)
}

/**
 * Decode JWT token (Base64 decode without verification)
 * WARNING: This only decodes the token, does NOT verify signature!
 * Signature verification must be done on the backend.
 *
 * Use this ONLY for reading claims from a token that was already verified by the backend.
 *
 * @param token - JWT token string
 * @returns JWTPayload or null if decoding fails
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // JWT structure: header.payload.signature
    const parts = token.split('.');

    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }

    // Decode payload (Base64URL)
    const payload = parts[1];
    const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));

    // Parse JSON
    const parsed: JWTPayload = JSON.parse(decodedPayload);

    // Validate required fields
    if (!parsed.sub || !parsed.email || !parsed.role || !parsed.exp) {
      console.error('Invalid JWT payload: missing required fields');
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if JWT token is expired
 * @param token - JWT token string or JWTPayload
 * @returns true if token is expired, false otherwise
 */
export function isTokenExpired(token: string | JWTPayload): boolean {
  try {
    const payload = typeof token === 'string' ? decodeJWT(token) : token;

    if (!payload || !payload.exp) {
      return true; // Consider invalid token as expired
    }

    // Check if expiration timestamp is in the past
    // exp is in seconds, Date.now() is in milliseconds
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (error) {
    console.error('Failed to check token expiration:', error);
    return true;
  }
}

/**
 * Get user role from JWT token
 * @param token - JWT token string
 * @returns UserRole ('USER' | 'ADMIN') or null if token is invalid
 */
export function getRoleFromToken(token: string): UserRole | null {
  const payload = decodeJWT(token);
  return payload?.role || null;
}

/**
 * Check if user has ADMIN role
 * @param token - JWT token string
 * @returns true if user is ADMIN, false otherwise
 */
export function isAdmin(token: string): boolean {
  const role = getRoleFromToken(token);
  return role === 'ADMIN';
}

/**
 * Check if user is authenticated (has valid, non-expired token)
 * @param token - JWT token string or null
 * @returns true if authenticated, false otherwise
 */
export function isAuthenticated(token: string | null): boolean {
  if (!token) {
    return false;
  }

  const payload = decodeJWT(token);
  if (!payload) {
    return false;
  }

  return !isTokenExpired(payload);
}

/**
 * Get user ID from JWT token
 * @param token - JWT token string
 * @returns User ID or null if token is invalid
 */
export function getUserIdFromToken(token: string): string | null {
  const payload = decodeJWT(token);
  return payload?.sub || null;
}

/**
 * Get email from JWT token
 * @param token - JWT token string
 * @returns Email or null if token is invalid
 */
export function getEmailFromToken(token: string): string | null {
  const payload = decodeJWT(token);
  return payload?.email || null;
}

/**
 * Get token expiration time in milliseconds
 * @param token - JWT token string
 * @returns Expiration timestamp in milliseconds or null if token is invalid
 */
export function getTokenExpiration(token: string): number | null {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return null;
  }

  // Convert seconds to milliseconds
  return payload.exp * 1000;
}

/**
 * Get time until token expires in milliseconds
 * @param token - JWT token string
 * @returns Milliseconds until expiration, 0 if expired, null if invalid token
 */
export function getTimeUntilExpiration(token: string): number | null {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return null;
  }

  const remaining = expiration - Date.now();
  return Math.max(0, remaining);
}
