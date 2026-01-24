import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Your Express Port
        changeOrigin: true,
        secure: false,
        // This removes the ECONNRESET by ensuring the proxy 
        // waits for the backend to be ready
        rewrite: (path) => path.replace(/^\/api/, '/api'), 
      },
    },
  },
})
