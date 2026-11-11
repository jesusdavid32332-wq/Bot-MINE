import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const rootDir = import.meta.dirname || path.resolve('.');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': rootDir,
      },
    },
    build: {
      chunkSizeWarningLimit: 2500,
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR WebSocket is not supported in the AI Studio sandboxed iframe environment
      hmr: process.env.ENABLE_HMR === 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
