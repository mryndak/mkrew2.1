// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), react()],
  // SSR (Server-Side Rendering) with Node.js adapter
  // This allows dynamic pages to be rendered on-demand
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  server: {
    host: '0.0.0.0',
    port: 4321
  },
  vite: {
    resolve: {
      alias: {
        '@': '/src'
      }
    }
  }
});
