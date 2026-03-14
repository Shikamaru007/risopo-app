import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json']
    },
    plugins: [
        react(),
        VitePWA({
            disable: true,
            registerType: 'autoUpdate',
            injectRegister: null,
            includeAssets: ['favicon.svg'],
            manifest: {
                name: 'Offline Invoice Generator',
                short_name: 'Invoice PWA',
                description: 'Offline-first invoice builder with Dexie and PDF export.',
                theme_color: '#ffffff',
                background_color: '#f7f7f8',
                display: 'standalone',
                start_url: '/',
                icons: [
                    {
                        src: '/favicon.svg',
                        sizes: '192x192',
                        type: 'image/svg+xml'
                    },
                    {
                        src: '/favicon.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}']
            },
            devOptions: { enabled: false }
        })
    ]
});
