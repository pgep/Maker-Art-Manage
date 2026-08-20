import { Router, Request, Response } from 'express';
import {
  listInsumos,
  getInsumoById,
  createInsumo,
  updateInsumo,
  toggleStatusInsumo,
  deleteInsumo,
  validateInsumoData,
} from '../services/insumoService.ts';

export const insumoRouter = Router();

// GET /insumos - List with search, status filter, pagination, sorting
insumoRouter.get('/', async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : 'ativos';
    const page = typeof req.query.page === 'string' ? parseInt(req.query.page, 10) : 1;
    const pageSize = typeof req.query.pageSize === 'string' ? parseInt(req.query.pageSize, 10) : 10;
    const sortBy = typeof req.query.sortBy === 'string' ? (req.query.sortBy as any) : 'id';
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

    const result = await listInsumos({
      search,
      status,
      page,
      pageSize,
      sortBy,
      sortOrder,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in GET /insumos:', error);
    return res.status(500).json({
      error: 'Erro interno ao consultar insumos.',
      message: error?.message || 'Falha na consulta',
    });
  }
});

// GET /insumos/:id - Single insumo
insumoRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID inválido. O ID deve ser um número inteiro positivo.',
      });
    }

    const item = await getInsumoById(id);
    if (!item) {
      return res.status(404).json({
        error: `Insumo com ID ${id} não encontrado.`,
      });
    }

    return res.status(200).json(item);
  } catch (error: any) {
    console.error(`Error in GET /insumos/${req.params.id}:`, error);
    return res.status(500).json({
      error: 'Erro interno ao buscar insumo.',
      message: error?.message || 'Falha na busca',
    });
  }
});

// POST /insumos - Create new insumo
insumoRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { isValid, errors, sanitized } = validateInsumoData(req.body, false);

    if (!isValid || !sanitized) {
      return res.status(400).json({
        error: 'Dados de formulário inválidos.',
        details: errors,
      });
    }

    const novo = await createInsumo(sanitized);
    return res.status(201).json(novo);
  } catch (error: any) {
    console.error('Error in POST /insumos:', error);
    const status = error.status || 500;
    return res.status(status).json({
      error: error?.message || 'Erro ao cadastrar insumo.',
      details: error.field ? { [error.field]: error.message } : undefined,
    });
  }
});

// PUT /insumos/:id - Update existing insumo
insumoRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID inválido. O ID deve ser um número inteiro positivo.',
      });
    }

    const existing = await getInsumoById(id);
    if (!existing) {
      return res.status(404).json({
        error: `Insumo com ID ${id} não encontrado para atualização.`,
      });
    }

    const { isValid, errors, sanitized } = validateInsumoData(req.body, true);

    if (!isValid || !sanitized) {
      return res.status(400).json({
        error: 'Dados de formulário inválidos.',
        details: errors,
      });
    }

    const updated = await updateInsumo(id, sanitized);
    return res.status(200).json(updated);
  } catch (error: any) {
    console.error(`Error in PUT /insumos/${req.params.id}:`, error);
    const status = error.status || 500;
    return res.status(status).json({
      error: error?.message || 'Erro ao atualizar insumo.',
      details: error.field ? { [error.field]: error.message } : undefined,
    });
  }
});

// PATCH /insumos/:id/status - Toggle status
insumoRouter.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID inválido. O ID deve ser um número inteiro positivo.',
      });
    }

    const existing = await getInsumoById(id);
    if (!existing) {
      return res.status(404).json({
        error: `Insumo com ID ${id} não encontrado.`,
      });
    }

    const explicitStatus = typeof req.body.ativo === 'boolean' ? req.body.ativo : undefined;
    const updated = await toggleStatusInsumo(id, explicitStatus);

    return res.status(200).json(updated);
  } catch (error: any) {
    console.error(`Error in PATCH /insumos/${req.params.id}/status:`, error);
    return res.status(500).json({
      error: 'Erro interno ao alterar status do insumo.',
      message: error?.message || 'Falha na alteração de status',
    });
  }
});

// DELETE /insumos/:id - Physical delete
insumoRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID inválido. O ID deve ser um número inteiro positivo.',
      });
    }

    const existing = await getInsumoById(id);
    if (!existing) {
      return res.status(404).json({
        error: `Insumo com ID ${id} não encontrado para exclusão.`,
      });
    }

    const deleted = await deleteInsumo(id);
    if (!deleted) {
      return res.status(500).json({
        error: 'Não foi possível excluir o insumo solicitado.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Insumo '${existing.nome}' excluído com sucesso.`,
      id,
    });
  } catch (error: any) {
    console.error(`Error in DELETE /insumos/${req.params.id}:`, error);
    return res.status(500).json({
      error: 'Erro interno ao excluir insumo.',
      message: error?.message || 'Falha na exclusão',
    });
  }
});
