import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0', // Allow access from other devices on the network
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:5000',
                changeOrigin: true
            },
            '/socket.io': {
                target: 'http://127.0.0.1:5000',
                ws: true
            }
        },
        // Fix 404 on refresh for client-side routes
        historyApiFallback: true,
        allowedHosts: true
    }
})
