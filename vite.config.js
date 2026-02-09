import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'build', // Maintain CRA output directory for compatibility
        chunkSizeWarningLimit: 1000, // Increase warning limit to 1000kb
    },
    server: {
        port: 3000, // Maintain CRA default port
        open: true,
    },
});
