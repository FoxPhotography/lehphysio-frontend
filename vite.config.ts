import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false,
      manifest: false, // public/manifest.json is the source of truth
      injectManifest: {
        // App shell + fonts + icons; the 300KB emoji picker and admin pages are fetched on demand.
        globPatterns: ['**/*.{js,css,html,woff2,webp}', 'icons/*.png'],
        globIgnores: ['**/emoji-picker-react*', '**/Admin-*', '**/ModeratorDashboard-*', 'og-*.png', 'logo.png'],
        maximumFileSizeToCacheInBytes: 600 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
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
