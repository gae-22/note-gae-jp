import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // ルートの .env を読み込む（BACKEND_PORT など共有設定）
    const rootEnv = loadEnv(mode, path.resolve(__dirname, '../../'), '');
    const backendPort = rootEnv.BACKEND_PORT ?? '8006';
    const backendUrl = `http://localhost:${backendPort}`;

    const proxy = {
        '/api': { target: backendUrl, changeOrigin: true },
        '/uploads': { target: backendUrl, changeOrigin: true },
    };

    return {
        plugins: [TanStackRouterVite(), react(), tailwindcss()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        server: { proxy },
        preview: { proxy },
    };
});
