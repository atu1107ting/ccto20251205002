import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 關鍵：使用相對路徑，讓 GitHub Pages 可以正確讀取 css/js
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})