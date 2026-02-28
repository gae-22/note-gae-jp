import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname, '../..');
  const env = loadEnv(mode, envDir, '');

  return {
    envDir,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            codemirror: [
              '@codemirror/state',
              '@codemirror/view',
              '@codemirror/commands',
              '@codemirror/language',
              '@codemirror/lang-markdown',
            ],
            markdown: [
              'unified',
              'remark-parse',
              'remark-gfm',
              'remark-rehype',
              'rehype-sanitize',
              'rehype-highlight',
              'rehype-stringify',
            ],
            vendor: ['react', 'react-dom', '@tanstack/react-query', '@tanstack/react-router'],
          },
        },
      },
    },
    server: {
      port: Number(env.FRONTEND_PORT) || 5173,
      proxy: {
        '/api': {
          target: `${env.BACKEND_URL || 'http://localhost'}:${env.BACKEND_PORT || '3000'}`,
          changeOrigin: true,
        },
      },
    },
  };
});
