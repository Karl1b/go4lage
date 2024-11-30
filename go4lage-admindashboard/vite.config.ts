import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../root/admin',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-admin.js',
        chunkFileNames: 'assets/[name]-admin.js',
        assetFileNames: 'assets/[name]-admin.[ext]',
      },
    },
  },
})
