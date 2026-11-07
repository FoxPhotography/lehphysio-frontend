import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        // Only long-lived, always-needed libraries get their own chunk (better caching across deploys).
        // Everything else (emoji picker, page code) is split by dynamic import.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor-react';
          if (id.includes('node_modules/lucide-react')) return 'vendor-icons';
          if (/node_modules\/(socket\.io-client|engine\.io-client|socket\.io-parser|engine\.io-parser|@socket\.io)/.test(id)) return 'vendor-socket';
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
