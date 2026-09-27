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
                  'Cache-Control': 'public, max-age=3600'
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
  plugins: [react(), fastStaticModelsPlugin()],
  server: {
    port: 3000,
    open: false,
    watch: {
      ignored: ['**/scratch_*/**', '**/scratch*/**', '**/dist/**', '**/*.mjs']
    }
  }
}));
