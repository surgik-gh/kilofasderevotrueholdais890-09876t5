/**
 * CSRF (Cross-Site Request Forgery) Protection Utilities
 * Implements CSRF token generation and validation
 * Requirements: 14.10
 */

import { supabase } from '../lib/supabase';

/**
 * Generates a cryptographically secure random token
 */
export function generateCSRFToken(): string {
  // Generate 32 random bytes and convert to hex
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Stores CSRF token in session storage
 */
export function storeCSRFToken(token: string): void {
  try {
    sessionStorage.setItem('csrf_token', token);
    sessionStorage.setItem('csrf_token_timestamp', Date.now().toString());
  } catch (error) {
    console.error('Failed to store CSRF token:', error);
  }
}

/**
 * Retrieves CSRF token from session storage
 */
export function getCSRFToken(): string | null {
  try {
    const token = sessionStorage.getItem('csrf_token');
    const timestamp = sessionStorage.getItem('csrf_token_timestamp');

    if (!token || !timestamp) {
      return null;
    }

    // Check if token is expired (1 hour)
    const age = Date.now() - parseInt(timestamp, 10);
    const maxAge = 60 * 60 * 1000; // 1 hour

    if (age > maxAge) {
      clearCSRFToken();
      return null;
    }

    return token;
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    return null;
  }
}

/**
 * Clears CSRF token from session storage
 */
export function clearCSRFToken(): void {
  try {
    sessionStorage.removeItem('csrf_token');
    sessionStorage.removeItem('csrf_token_timestamp');
  } catch (error) {
    console.error('Failed to clear CSRF token:', error);
  }
}

/**
 * Gets or creates CSRF token
 */
export function getOrCreateCSRFToken(): string {
  let token = getCSRFToken();

  if (!token) {
    token = generateCSRFToken();
    storeCSRFToken(token);
  }

  return token;
}

/**
 * Validates CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  const storedToken = getCSRFToken();

  if (!storedToken) {
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  return constantTimeCompare(token, storedToken);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Adds CSRF token to request headers
 */
export function addCSRFTokenToHeaders(headers: HeadersInit = {}): HeadersInit {
  const token = getOrCreateCSRFToken();

  return {
    ...headers,
    'X-CSRF-Token': token
  };
}

/**
 * Adds CSRF token to form data
 */
export function addCSRFTokenToFormData(formData: FormData): FormData {
  const token = getOrCreateCSRFToken();
  formData.append('csrf_token', token);
  return formData;
}

/**
 * Adds CSRF token to URL parameters
 */
export function addCSRFTokenToURL(url: string): string {
  const token = getOrCreateCSRFToken();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}csrf_token=${encodeURIComponent(token)}`;
}

/**
 * Validates CSRF token from request
 */
export function validateCSRFTokenFromRequest(
  headers: Headers | Record<string, string>,
  body?: any
): boolean {
  // Try to get token from header
  let token: string | null = null;

  if (headers instanceof Headers) {
    token = headers.get('X-CSRF-Token');
  } else {
    token = headers['X-CSRF-Token'] || headers['x-csrf-token'];
  }

  // If not in header, try body
  if (!token && body) {
    token = body.csrf_token;
  }

  if (!token) {
    return false;
  }

  return validateCSRFToken(token);
}

/**
 * CSRF protection middleware for API calls
 */
export async function csrfProtectionMiddleware<T>(
  apiCall: () => Promise<T>
): Promise<T> {
  // Ensure we have a CSRF token
  getOrCreateCSRFToken();

  try {
    return await apiCall();
  } catch (error: any) {
    // If we get a CSRF error, regenerate token and retry once
    if (error?.message?.includes('CSRF') || error?.status === 403) {
      clearCSRFToken();
      const newToken = generateCSRFToken();
      storeCSRFToken(newToken);
      return await apiCall();
    }
    throw error;
  }
}

/**
 * Creates a protected fetch function with CSRF token
 */
export function createProtectedFetch() {
  return async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = addCSRFTokenToHeaders(options.headers);

    return fetch(url, {
      ...options,
      headers,
      credentials: 'same-origin' // Important for CSRF protection
    });
  };
}

/**
 * React hook for CSRF token (for use in components)
 */
export function useCSRFToken(): {
  token: string;
  refreshToken: () => void;
  addToHeaders: (headers?: HeadersInit) => HeadersInit;
  addToFormData: (formData: FormData) => FormData;
} {
  const token = getOrCreateCSRFToken();

  const refreshToken = () => {
    clearCSRFToken();
    return generateCSRFToken();
  };

  const addToHeaders = (headers: HeadersInit = {}) => {
    return addCSRFTokenToHeaders(headers);
  };

  const addToFormData = (formData: FormData) => {
    return addCSRFTokenToFormData(formData);
  };

  return {
    token,
    refreshToken,
    addToHeaders,
    addToFormData
  };
}

/**
 * Validates origin header to prevent CSRF
 */
export function validateOrigin(
  origin: string | null,
  allowedOrigins: string[]
): boolean {
  if (!origin) {
    return false;
  }

  return allowedOrigins.some(allowed => {
    if (allowed === '*') {
      return true;
    }
    if (allowed.endsWith('*')) {
      const prefix = allowed.slice(0, -1);
      return origin.startsWith(prefix);
    }
    return origin === allowed;
  });
}

/**
 * Validates referer header to prevent CSRF
 */
export function validateReferer(
  referer: string | null,
  allowedDomains: string[]
): boolean {
  if (!referer) {
    return false;
  }

  try {
    const refererUrl = new URL(referer);
    return allowedDomains.some(domain => {
      if (domain === '*') {
        return true;
      }
      if (domain.startsWith('*.')) {
        const suffix = domain.slice(2);
        return refererUrl.hostname.endsWith(suffix);
      }
      return refererUrl.hostname === domain;
    });
  } catch (error) {
    return false;
  }
}

/**
 * Double submit cookie pattern for CSRF protection
 */
export class DoubleSubmitCSRFProtection {
  private cookieName: string;

  constructor(cookieName: string = 'csrf_token') {
    this.cookieName = cookieName;
  }

  /**
   * Sets CSRF token in cookie
   */
  setTokenCookie(token: string): void {
    document.cookie = `${this.cookieName}=${token}; path=/; SameSite=Strict; Secure`;
  }

  /**
   * Gets CSRF token from cookie
   */
  getTokenFromCookie(): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === this.cookieName) {
        return value;
      }
    }
    return null;
  }

  /**
   * Validates double submit token
   */
  validate(headerToken: string): boolean {
    const cookieToken = this.getTokenFromCookie();
    
    if (!cookieToken || !headerToken) {
      return false;
    }

    return constantTimeCompare(headerToken, cookieToken);
  }

  /**
   * Generates and sets new token
   */
  generateToken(): string {
    const token = generateCSRFToken();
    this.setTokenCookie(token);
    storeCSRFToken(token);
    return token;
  }
}

/**
 * Logs CSRF violation attempts
 */
export function logCSRFViolation(
  userId: string | null,
  details: string
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId: userId || 'anonymous',
    details,
    severity: 'HIGH',
    type: 'CSRF_VIOLATION'
  };

  console.error('[SECURITY] CSRF Violation:', logEntry);

  // In production, send to security monitoring service
}

/**
 * SameSite cookie configuration helper
 */
export function configureSameSiteCookies(): void {
  // This is a reminder to configure SameSite cookies on the server
  console.info('Ensure all cookies are set with SameSite=Strict or SameSite=Lax');
}

/**
 * CSRF protection configuration
 */
export interface CSRFConfig {
  tokenName?: string;
  headerName?: string;
  cookieName?: string;
  tokenLifetime?: number; // milliseconds
  allowedOrigins?: string[];
  allowedDomains?: string[];
}

/**
 * CSRF Protection Manager
 */
export class CSRFProtectionManager {
  private config: Required<CSRFConfig>;
  private doubleSubmit: DoubleSubmitCSRFProtection;

  constructor(config: CSRFConfig = {}) {
    this.config = {
      tokenName: config.tokenName || 'csrf_token',
      headerName: config.headerName || 'X-CSRF-Token',
      cookieName: config.cookieName || 'csrf_token',
      tokenLifetime: config.tokenLifetime || 60 * 60 * 1000, // 1 hour
      allowedOrigins: config.allowedOrigins || [window.location.origin],
      allowedDomains: config.allowedDomains || [window.location.hostname]
    };

    this.doubleSubmit = new DoubleSubmitCSRFProtection(this.config.cookieName);
  }

  /**
   * Initializes CSRF protection
   */
  initialize(): string {
    return this.doubleSubmit.generateToken();
  }

  /**
   * Validates request for CSRF
   */
  validateRequest(
    headers: Headers | Record<string, string>,
    origin?: string | null,
    referer?: string | null
  ): boolean {
    // Validate origin
    if (origin && !validateOrigin(origin, this.config.allowedOrigins)) {
      logCSRFViolation(null, `Invalid origin: ${origin}`);
      return false;
    }

    // Validate referer
    if (referer && !validateReferer(referer, this.config.allowedDomains)) {
      logCSRFViolation(null, `Invalid referer: ${referer}`);
      return false;
    }

    // Validate CSRF token
    let token: string | null = null;
    if (headers instanceof Headers) {
      token = headers.get(this.config.headerName);
    } else {
      token = headers[this.config.headerName];
    }

    if (!token) {
      logCSRFViolation(null, 'Missing CSRF token');
      return false;
    }

    if (!this.doubleSubmit.validate(token)) {
      logCSRFViolation(null, 'Invalid CSRF token');
      return false;
    }

    return true;
  }

  /**
   * Adds CSRF token to request
   */
  addTokenToRequest(options: RequestInit = {}): RequestInit {
    const token = getOrCreateCSRFToken();

    return {
      ...options,
      headers: {
        ...options.headers,
        [this.config.headerName]: token
      },
      credentials: 'same-origin'
    };
  }
}

// Export CSRF protection utilities
export const CSRFProtection = {
  generateCSRFToken,
  storeCSRFToken,
  getCSRFToken,
  clearCSRFToken,
  getOrCreateCSRFToken,
  validateCSRFToken,
  addCSRFTokenToHeaders,
  addCSRFTokenToFormData,
  addCSRFTokenToURL,
  validateCSRFTokenFromRequest,
  csrfProtectionMiddleware,
  createProtectedFetch,
  useCSRFToken,
  validateOrigin,
  validateReferer,
  logCSRFViolation,
  DoubleSubmitCSRFProtection,
  CSRFProtectionManager
};
