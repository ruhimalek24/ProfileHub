import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Send /api calls to Express. Same origin = cookies just work.
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
