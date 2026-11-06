import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the API runs on port 5000; the proxy keeps cookies on one origin.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:5000' } },
});
