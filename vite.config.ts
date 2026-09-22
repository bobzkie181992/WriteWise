import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {spawn} from 'child_process';

export default defineConfig(() => {
  // Start backend server on port 3001 in development mode
  if (process.env.NODE_ENV !== 'production' && !process.env.BACKEND_ONLY) {
    console.log('Starting full-stack development backend server on port 3001...');
    const serverProcess = spawn('npx', ['tsx', 'server.ts'], {
      env: { ...process.env, PORT: '3001', BACKEND_ONLY: 'true' },
      stdio: 'inherit',
      shell: true,
    });
    process.on('exit', () => serverProcess.kill());
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Configure development API proxy to route /api requests to Express server
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
