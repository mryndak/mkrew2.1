// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), react()],
  output: 'hybrid', // Enable SSR for specific pages (login uses export const prerender = false)
  vite: {
    resolve: {
      alias: {
        '@': '/src'
      }
    }
  }
});
