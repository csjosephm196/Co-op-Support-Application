import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // 127.0.0.1 avoids Windows resolving "localhost" to ::1 while Node listens on IPv4 only
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
});
