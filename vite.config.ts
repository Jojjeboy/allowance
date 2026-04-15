import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Allowance App',
        short_name: 'Allowance',
        description: 'A Allowance app with Vue 3 and Firebase Auth',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'img/icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'img/icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  base: '/allowance/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
