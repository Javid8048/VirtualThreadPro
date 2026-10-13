import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function fastStaticModelsPlugin() {
  return {
    name: 'fast-static-models',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const cleanUrl = (req.url || '').split('?')[0];
        if (cleanUrl.startsWith('/models/') || cleanUrl.startsWith('/garments/')) {
          const filePath = path.join(process.cwd(), 'public', cleanUrl);
          if (fs.existsSync(filePath)) {
            try {
              const stat = fs.statSync(filePath);
              if (stat.isFile()) {
                const ext = path.extname(filePath).toLowerCase();
                const mimeTypes = {
                  '.bin': 'application/octet-stream',
                  '.gltf': 'model/gltf+json',
                  '.glb': 'model/gltf-binary',
                  '.png': 'image/png',
                  '.jpg': 'image/jpeg',
                  '.jpeg': 'image/jpeg',
                  '.hdr': 'application/octet-stream',
                  '.obj': 'text/plain'
                };
                res.writeHead(200, {
                  'Content-Length': stat.size,
                  'Content-Type': mimeTypes[ext] || 'application/octet-stream',
                  'Access-Control-Allow-Origin': '*',
                  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                  'Pragma': 'no-cache',
                  'Expires': '0'
                });
                fs.createReadStream(filePath, { highWaterMark: 1024 * 1024 }).pipe(res);
                return;
              }
            } catch (e) {
              // fallback to vite standard middleware
            }
          }
        }
        next();
      });
    }
  };
}

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/VirtualThreadPro/' : '/',
  define: {
    __APP_BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  plugins: [react(), fastStaticModelsPlugin()],
  server: {
    port: 3000,
    open: false,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    watch: {
      usePolling: true,
      interval: 300,
      ignored: ['**/dist/**']
    }
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
}));
