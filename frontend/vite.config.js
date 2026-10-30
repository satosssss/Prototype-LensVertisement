import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,

    // Proxy API calls to the Express backend during development.
    // Because the browser sees a same-origin request, CORS never applies in
    // dev. In production, set VITE_API_BASE_URL to the deployed backend.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
