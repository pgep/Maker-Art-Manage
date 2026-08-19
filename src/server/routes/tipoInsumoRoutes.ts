import { Router, Request, Response } from 'express';
import {
  listTiposInsumo,
  getTipoInsumoById,
  createTipoInsumo,
  updateTipoInsumo,
  toggleStatusTipoInsumo,
  deleteTipoInsumo,
  validateTipoInsumoData,
} from '../services/tipoInsumoService.ts';

export const tipoInsumoRouter = Router();

// GET /tipos-insumo - List with search, status filter, pagination, sorting
tipoInsumoRouter.get('/', async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : 'ativos';
    const page = typeof req.query.page === 'string' ? parseInt(req.query.page, 10) : 1;
    const pageSize = typeof req.query.pageSize === 'string' ? parseInt(req.query.pageSize, 10) : 10;
    const sortBy = typeof req.query.sortBy === 'string' ? (req.query.sortBy as any) : 'id';
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

    const result = await listTiposInsumo({
      search,
      status,
      page,
      pageSize,
      sortBy,
      sortOrder,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in GET /tipos-insumo:', error);
    return res.status(500).json({
      error: 'Erro interno ao consultar tipos de insumo.',
      message: error?.message || 'Falha na consulta',
    });
  }
});

// GET /tipos-insumo/:id - Get single record
tipoInsumoRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID inválido. O ID deve ser um número inteiro positivo.',
      });
    }

    const item = await getTipoInsumoById(id);
    if (!item) {
      return res.status(404).json({
        error: `Tipo de insumo com ID ${id} não encontrado.`,
      });
    }

    return res.status(200).json(item);
  } catch (error: any) {
    console.error(`Error in GET /tipos-insumo/${req.params.id}:`, error);
    return res.status(500).json({
      error: 'Erro interno ao buscar tipo de insumo.',
      message: error?.message || 'Falha na busca',
    });
  }
});

// POST /tipos-insumo - Create new record
tipoInsumoRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { isValid, errors, sanitized } = validateTipoInsumoData(req.body);

    if (!isValid || !sanitized) {
      return res.status(400).json({
        error: 'Dados de formulário inválidos.',
        details: errors,
      });
    }

    const novo = await createTipoInsumo(sanitized);
    return res.status(201).json(novo);
  } catch (error: any) {
    console.error('Error in POST /tipos-insumo:', error);
    const status = error.status || 500;
    return res.status(status).json({
      error: error?.message || 'Erro ao criar tipo de insumo.',
      details: error.field ? { [error.field]: error.message } : undefined,
    });
  }
});

// PUT /tipos-insumo/:id - Update existing record
tipoInsumoRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID inválido. O ID deve ser um número inteiro positivo.',
      });
    }

    const existing = await getTipoInsumoById(id);
    if (!existing) {
      return res.status(404).json({
        error: `Tipo de insumo com ID ${id} não encontrado para atualização.`,
      });
    }

    const { isValid, errors, sanitized } = validateTipoInsumoData(req.body);

    if (!isValid || !sanitized) {
      return res.status(400).json({
        error: 'Dados de formulário inválidos.',
        details: errors,
      });
    }

    const updated = await updateTipoInsumo(id, sanitized);
    return res.status(200).json(updated);
  } catch (error: any) {
    console.error(`Error in PUT /tipos-insumo/${req.params.id}:`, error);
    const status = error.status || 500;
    return res.status(status).json({
      error: error?.message || 'Erro ao atualizar tipo de insumo.',
      details: error.field ? { [error.field]: error.message } : undefined,
    });
  }
});

// PATCH /tipos-insumo/:id/status - Toggle or update status (Ativo / Inativo)
tipoInsumoRouter.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID inválido. O ID deve ser um número inteiro positivo.',
      });
    }

    const existing = await getTipoInsumoById(id);
    if (!existing) {
      return res.status(404).json({
        error: `Tipo de insumo com ID ${id} não encontrado.`,
      });
    }

    const explicitStatus = typeof req.body.ativo === 'boolean' ? req.body.ativo : undefined;
    const updated = await toggleStatusTipoInsumo(id, explicitStatus);

    return res.status(200).json(updated);
  } catch (error: any) {
    console.error(`Error in PATCH /tipos-insumo/${req.params.id}/status:`, error);
    return res.status(500).json({
      error: 'Erro interno ao alterar status do tipo de insumo.',
      message: error?.message || 'Falha na alteração de status',
    });
  }
});

// DELETE /tipos-insumo/:id - Physical delete
tipoInsumoRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID inválido. O ID deve ser um número inteiro positivo.',
      });
    }

    const existing = await getTipoInsumoById(id);
    if (!existing) {
      return res.status(404).json({
        error: `Tipo de insumo com ID ${id} não encontrado para exclusão.`,
      });
    }

    const deleted = await deleteTipoInsumo(id);
    if (!deleted) {
      return res.status(500).json({
        error: 'Não foi possível excluir o registro solicitado.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Tipo de insumo '${existing.nome}' excluído com sucesso.`,
      id,
    });
  } catch (error: any) {
    console.error(`Error in DELETE /tipos-insumo/${req.params.id}:`, error);
    return res.status(500).json({
      error: 'Erro interno ao excluir tipo de insumo.',
      message: error?.message || 'Falha na exclusão',
    });
  }
});
