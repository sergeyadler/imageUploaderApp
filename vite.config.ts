import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as process from "node:process";
import dotenv from 'dotenv'
dotenv.config()
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // не делаем rewrite
      }
    },
    port: process.env.PORT ? parseInt(process.env.PORT): 5743,
    host: true,
    allowedHosts: true
  }

})
