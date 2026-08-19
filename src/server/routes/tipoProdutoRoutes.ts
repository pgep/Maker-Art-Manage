import { Router, Request, Response } from 'express';
import {
  listTiposProduto,
  getTipoProdutoById,
  createTipoProduto,
  updateTipoProduto,
  toggleStatusTipoProduto,
  deleteTipoProduto,
  validateTipoProdutoData,
} from '../services/tipoProdutoService.ts';

export const tipoProdutoRouter = Router();

// GET /tipos-produto - List with search, status filtering, pagination, sorting
tipoProdutoRouter.get('/', async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : 'ativos';
    const page = typeof req.query.page === 'string' ? parseInt(req.query.page, 10) : 1;
    const pageSize = typeof req.query.pageSize === 'string' ? parseInt(req.query.pageSize, 10) : 10;
    const sortBy = typeof req.query.sortBy === 'string' ? (req.query.sortBy as any) : 'id';
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

    const result = await listTiposProduto({
      search,
      status,
      page,
      pageSize,
      sortBy,
      sortOrder,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in GET /tipos-produto:', error);
    return res.status(500).json({
      error: 'Erro interno ao consultar tipos de produto.',
      message: error?.message || 'Falha na consulta',
    });
  }
});

// GET /tipos-produto/:id - Get single record
tipoProdutoRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID inválido. O ID deve ser um número inteiro positivo.',
      });
    }

    const item = await getTipoProdutoById(id);
    if (!item) {
      return res.status(404).json({
        error: `Tipo de produto com ID ${id} não encontrado.`,
      });
    }

    return res.status(200).json(item);
  } catch (error: any) {
    console.error(`Error in GET /tipos-produto/${req.params.id}:`, error);
    return res.status(500).json({
      error: 'Erro interno ao buscar tipo de produto.',
      message: error?.message || 'Falha na busca',
    });
  }
});

// POST /tipos-produto - Create new record
tipoProdutoRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { isValid, errors, sanitized } = validateTipoProdutoData(req.body);

    if (!isValid || !sanitized) {
      return res.status(400).json({
        error: 'Dados de formulário inválidos.',
        details: errors,
      });
    }

    const novo = await createTipoProduto(sanitized);
    return res.status(201).json(novo);
  } catch (error: any) {
    console.error('Error in POST /tipos-produto:', error);
    const status = error.status || 500;
    return res.status(status).json({
      error: error?.message || 'Erro ao criar tipo de produto.',
      details: error.field ? { [error.field]: error.message } : undefined,
    });
  }
});

// PUT /tipos-produto/:id - Update existing record
tipoProdutoRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID inválido. O ID deve ser um número inteiro positivo.',
      });
    }

    const existing = await getTipoProdutoById(id);
    if (!existing) {
      return res.status(404).json({
        error: `Tipo de produto com ID ${id} não encontrado para atualização.`,
      });
    }

    const { isValid, errors, sanitized } = validateTipoProdutoData(req.body);

    if (!isValid || !sanitized) {
      return res.status(400).json({
        error: 'Dados de formulário inválidos.',
        details: errors,
      });
    }

    const updated = await updateTipoProduto(id, sanitized);
    return res.status(200).json(updated);
  } catch (error: any) {
    console.error(`Error in PUT /tipos-produto/${req.params.id}:`, error);
    const status = error.status || 500;
    return res.status(status).json({
      error: error?.message || 'Erro ao atualizar tipo de produto.',
      details: error.field ? { [error.field]: error.message } : undefined,
    });
  }
});

// PATCH /tipos-produto/:id/status - Toggle or update status (Ativo / Inativo)
tipoProdutoRouter.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID inválido. O ID deve ser um número inteiro positivo.',
      });
    }

    const existing = await getTipoProdutoById(id);
    if (!existing) {
      return res.status(404).json({
        error: `Tipo de produto com ID ${id} não encontrado.`,
      });
    }

    const explicitStatus = typeof req.body.ativo === 'boolean' ? req.body.ativo : undefined;
    const updated = await toggleStatusTipoProduto(id, explicitStatus);

    return res.status(200).json(updated);
  } catch (error: any) {
    console.error(`Error in PATCH /tipos-produto/${req.params.id}/status:`, error);
    return res.status(500).json({
      error: 'Erro interno ao alterar status do tipo de produto.',
      message: error?.message || 'Falha na alteração de status',
    });
  }
});

// DELETE /tipos-produto/:id - Physical delete
tipoProdutoRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID inválido. O ID deve ser um número inteiro positivo.',
      });
    }

    const existing = await getTipoProdutoById(id);
    if (!existing) {
      return res.status(404).json({
        error: `Tipo de produto com ID ${id} não encontrado para exclusão.`,
      });
    }

    const deleted = await deleteTipoProduto(id);
    if (!deleted) {
      return res.status(500).json({
        error: 'Não foi possível excluir o registro solicitado.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Tipo de produto '${existing.nome}' excluído com sucesso.`,
      id,
    });
  } catch (error: any) {
    console.error(`Error in DELETE /tipos-produto/${req.params.id}:`, error);
    return res.status(500).json({
      error: 'Erro interno ao excluir tipo de produto.',
      message: error?.message || 'Falha na exclusão',
    });
  }
});
