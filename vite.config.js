import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        port: 3000,
        open: true,
        allowedHosts: ['d5e9-182-4-135-144.ngrok-free.app']
    },
    build: {
        outDir: 'dist',
        minify: true
    }
})