import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Google sign-in only works from origins registered on the OAuth client,
    // so fail loudly instead of silently moving to another port.
    port: 5173,
    strictPort: true,
  },
});
