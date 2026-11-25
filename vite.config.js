import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

//------------------------------------------------------------------------------------//
/**
 * Middleware handler for serving local WebP animation frames from /frames/.
 * @param {import('http').IncomingMessage} req - Incoming HTTP request.
 * @param {import('http').ServerResponse} res - Outgoing HTTP response.
 * @param {Function} next - Next middleware in chain.
 * @returns {void}
 */
function handleFramesRequest(req, res, next) {
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
}

export default defineConfig({
  server: {
    port: 5173,
    host: true,
    fs: {
      allow: ['.']
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        booking: path.resolve(__dirname, 'booking.html'),
        notFound: path.resolve(__dirname, '404.html')
      }
    }
  },
  plugins: [
    {
      name: 'serve-frames-middleware',
      configureServer(server) {
        server.middlewares.use(handleFramesRequest);
      },
      configurePreviewServer(server) {
        server.middlewares.use(handleFramesRequest);
      }
    }
  ]
});

//------------------------------End of file---------------------------------------------------//
