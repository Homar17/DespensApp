import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'DespensApp',
        short_name: 'DespensApp',
        description: 'Gestor de inventario y compras',
        theme_color: '#ffffff',
        icons: [] // Los agregaremos más adelante
      }
    })
  ],
})