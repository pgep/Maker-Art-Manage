import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { unidadeMedidaRouter } from './src/server/routes/unidadeMedidaRoutes.ts';
import { tipoProdutoRouter } from './src/server/routes/tipoProdutoRoutes.ts';
import { tipoInsumoRouter } from './src/server/routes/tipoInsumoRoutes.ts';
import { insumoRouter } from './src/server/routes/insumoRoutes.ts';
import { markupRouter } from './src/server/routes/markupRoutes.ts';
import { produtoRouter } from './src/server/routes/produtoRoutes.ts';

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

  // REST endpoints
  app.use('/api/unidades-medida', unidadeMedidaRouter);
  app.use('/unidades-medida', unidadeMedidaRouter);

  app.use('/api/tipos-produto', tipoProdutoRouter);
  app.use('/tipos-produto', tipoProdutoRouter);

  app.use('/api/tipos-insumo', tipoInsumoRouter);
  app.use('/tipos-insumo', tipoInsumoRouter);

  app.use('/api/insumos', insumoRouter);
  app.use('/insumos', insumoRouter);

  app.use('/api/markups', markupRouter);
  app.use('/markups', markupRouter);

  app.use('/api/produtos', produtoRouter);
  app.use('/produtos', produtoRouter);

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
