import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/WebPackager/',
  plugins: [
    vue(),
    vuetify({ autoImport: true, styles: { configFile: 'src/styles/settings.scss' } }), // Enabled by default
  ],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler' // or "modern"
      }
    }
  }
})
