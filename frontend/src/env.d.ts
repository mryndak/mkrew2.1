/// <reference types="astro/client" />

/**
 * Extend Window interface to include runtime environment variables
 */
declare global {
  interface Window {
    __ENV__?: {
      PUBLIC_API_BASE_URL?: string;
    };
  }
}

export {};