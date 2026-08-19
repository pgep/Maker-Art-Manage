import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { unidadeMedidaRouter } from './src/server/routes/unidadeMedidaRoutes.ts';
import { ensureInitialSeeds } from './src/server/services/unidadeMedidaService.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Maker Art Manage API',
      timestamp: new Date().toISOString(),
    });
  });

  // Unidades de Medida REST endpoints (support both /api/unidades-medida and /unidades-medida)
  app.use('/api/unidades-medida', unidadeMedidaRouter);
  app.use('/unidades-medida', unidadeMedidaRouter);

  // Lazy seed verification (does not block server startup)
  ensureInitialSeeds().catch((err) => {
    console.error('Initial seeding notice:', err?.message || err);
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Maker Art Manage server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
