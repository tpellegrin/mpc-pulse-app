import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [viteReact(), tsconfigPaths(), svgr()],
  base: '/mpc-pulse-app/',
  resolve: {
    alias: {
      // Support absolute imports based on src/ structure
      components: path.resolve(__dirname, 'src/components'),
      '@components': path.resolve(__dirname, 'src/components'),
      containers: path.resolve(__dirname, 'src/containers'),
      features: path.resolve(__dirname, 'src/features'),
      hooks: path.resolve(__dirname, 'src/hooks'),
      globals: path.resolve(__dirname, 'src/globals'),
      assets: path.resolve(__dirname, 'src/assets'),
      views: path.resolve(__dirname, 'src/views'),
      i18n: path.resolve(__dirname, 'src/i18n'),
      utils: path.resolve(__dirname, 'src/utils'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      domain: path.resolve(__dirname, 'src/domain'),
    },
  },
  build: {
    outDir: './build',
    sourcemap: false,
    rollupOptions: {
      external: /\/mocks\/.*/,
      cache: false,
    },
  },
  optimizeDeps: {
    exclude: ['js-big-decimal'],
    // exclude: ['@matrix-org/olm'],
  },
  define: {
    'process.env': {},
  },
  server: {
    hmr: {
      protocol: 'ws',
      // Add you ip here for live-reload
      // host: '192.168.1.20',
    },
  },
});
