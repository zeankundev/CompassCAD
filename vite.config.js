import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        port: 3000,
        open: true,
        allowedHosts: ['f357-101-128-103-111.ngrok-free.app']
    },
    build: {
        outDir: 'dist',
        minify: true
    }
})