import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increase chunk size warning limit to 1000 kB
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Put Recharts (a potentially large dependency) into its own chunk
          if (id.includes('node_modules/recharts')) {
            return 'recharts-vendor'
          }

          // Put all other node_modules into a shared vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true, // fail fast if 5173 is taken; avoids fallback to 5174 which breaks cookies
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: 'localhost',
      },
    },
    // Configure CORS for cookies to work properly
    cors: {
      origin: 'localhost',
      credentials: true,
    },
  },
})
