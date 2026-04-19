import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Set base to '/' for root deployment or '/spendwise/' for GitHub Pages subdirectory
// Change to '/spendwise/' if deploying to https://username.github.io/spendwise/
const base = '/'

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'pdf-vendor': ['pdfjs-dist'],
          'chart-vendor': ['recharts'],
          'motion-vendor': ['framer-motion'],
        },
      },
    },
    // Enable compression hints
    target: 'esnext',
    minify: 'esbuild',
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
  worker: {
    format: 'es',
  },
})
