import { Router, Request, Response } from 'express';
import {
  listUnidadesMedida,
  getUnidadeMedidaById,
  createUnidadeMedida,
  updateUnidadeMedida,
  deleteUnidadeMedida,
  validateUnidadeMedidaData,
  ALLOWED_TIPOS,
} from '../services/unidadeMedidaService.ts';

export const unidadeMedidaRouter = Router();

// GET /unidades-medida - List all with pagination and search
unidadeMedidaRouter.get('/', async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const tipo = typeof req.query.tipo === 'string' ? req.query.tipo : undefined;
    const page = typeof req.query.page === 'string' ? parseInt(req.query.page, 10) : 1;
    const pageSize = typeof req.query.pageSize === 'string' ? parseInt(req.query.pageSize, 10) : 10;
    const sortBy = typeof req.query.sortBy === 'string' ? (req.query.sortBy as any) : 'id';
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

    const result = await listUnidadesMedida({
      search,
      tipo,
      page,
      pageSize,
      sortBy,
      sortOrder,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in GET /unidades-medida:', error);
    return res.status(500).json({
      error: 'Erro interno ao consultar unidades de medida.',
      message: error?.message || 'Falha na consulta',
    });
  }
});

// GET /unidades-medida/tipos - Get allowed types
unidadeMedidaRouter.get('/tipos', (_req: Request, res: Response) => {
  return res.status(200).json({
    tipos: ALLOWED_TIPOS,
  });
});

// GET /unidades-medida/:id - Get by ID
unidadeMedidaRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID inválido. O ID deve ser um número inteiro positivo.',
      });
    }

    const unidade = await getUnidadeMedidaById(id);
    if (!unidade) {
      return res.status(404).json({
        error: `Unidade de medida com ID ${id} não encontrada.`,
      });
    }

    return res.status(200).json(unidade);
  } catch (error: any) {
    console.error(`Error in GET /unidades-medida/${req.params.id}:`, error);
    return res.status(500).json({
      error: 'Erro interno ao buscar unidade de medida.',
      message: error?.message || 'Falha na busca',
    });
  }
});

// POST /unidades-medida - Create new
unidadeMedidaRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { isValid, errors, sanitized } = validateUnidadeMedidaData(req.body);

    if (!isValid || !sanitized) {
      return res.status(400).json({
        error: 'Dados de formulário inválidos.',
        details: errors,
      });
    }

    const novaUnidade = await createUnidadeMedida(sanitized);
    return res.status(201).json(novaUnidade);
  } catch (error: any) {
    console.error('Error in POST /unidades-medida:', error);
    return res.status(500).json({
      error: 'Erro interno ao criar unidade de medida.',
      message: error?.message || 'Falha na gravação',
    });
  }
});

// PUT /unidades-medida/:id - Update existing
unidadeMedidaRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID inválido. O ID deve ser um número inteiro positivo.',
      });
    }

    // Check if exists
    const existing = await getUnidadeMedidaById(id);
    if (!existing) {
      return res.status(404).json({
        error: `Unidade de medida com ID ${id} não encontrada para atualização.`,
      });
    }

    const { isValid, errors, sanitized } = validateUnidadeMedidaData(req.body);

    if (!isValid || !sanitized) {
      return res.status(400).json({
        error: 'Dados de formulário inválidos.',
        details: errors,
      });
    }

    const updated = await updateUnidadeMedida(id, sanitized);
    return res.status(200).json(updated);
  } catch (error: any) {
    console.error(`Error in PUT /unidades-medida/${req.params.id}:`, error);
    return res.status(500).json({
      error: 'Erro interno ao atualizar unidade de medida.',
      message: error?.message || 'Falha na atualização',
    });
  }
});

// DELETE /unidades-medida/:id - Delete by ID
unidadeMedidaRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID inválido. O ID deve ser um número inteiro positivo.',
      });
    }

    const existing = await getUnidadeMedidaById(id);
    if (!existing) {
      return res.status(404).json({
        error: `Unidade de medida com ID ${id} não encontrada para exclusão.`,
      });
    }

    const deleted = await deleteUnidadeMedida(id);
    if (!deleted) {
      return res.status(500).json({
        error: 'Não foi possível excluir o registro solicitado.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Unidade de medida '${existing.nome}' excluída com sucesso.`,
      id,
    });
  } catch (error: any) {
    console.error(`Error in DELETE /unidades-medida/${req.params.id}:`, error);
    return res.status(500).json({
      error: 'Erro interno ao excluir unidade de medida.',
      message: error?.message || 'Falha na exclusão',
    });
  }
});
