import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  server: {
    port: 5173,
    host: true,
    fs: {
      allow: ['.']
    }
  },
  plugins: [
    {
      name: 'serve-frames-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url) return next();
          const cleanUrl = req.url.split('?')[0];
          const match = cleanUrl.match(/^\/?(frames\/com-part-[123]\/ezgif-frame-\d+\.webp)$/);
          if (match) {
            const relPath = match[1];
            const fullPath = path.resolve(process.cwd(), relPath);
            if (fs.existsSync(fullPath)) {
              res.setHeader('Content-Type', 'image/webp');
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
              return fs.createReadStream(fullPath).pipe(res);
            }
          }
          next();
        });
      }
    }
  ]
});
