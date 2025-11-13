// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), react()],
  // Static output for now (SSR requires adapter - can be added later)
  // Login page uses client-side React islands for interactivity
  vite: {
    resolve: {
      alias: {
        '@': '/src'
      }
    }
  }
});
