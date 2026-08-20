import { Router, Request, Response } from 'express';
import {
  listMarkups,
  getMarkupById,
  createMarkup,
  updateMarkup,
  toggleStatusMarkup,
  deleteMarkup,
  validateMarkupData,
} from '../services/markupService.ts';

export const markupRouter = Router();

// GET /markups - List with search, status filter, pagination, sorting
markupRouter.get('/', async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : 'ativos';
    const page = typeof req.query.page === 'string' ? parseInt(req.query.page, 10) : 1;
    const pageSize = typeof req.query.pageSize === 'string' ? parseInt(req.query.pageSize, 10) : 10;
    const sortBy = typeof req.query.sortBy === 'string' ? (req.query.sortBy as any) : 'id';
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

    const result = await listMarkups({
      search,
      status,
      page,
      pageSize,
      sortBy,
      sortOrder,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in GET /markups:', error);
    return res.status(500).json({
      error: 'Erro interno ao consultar markups.',
      message: error?.message || 'Falha na consulta',
    });
  }
});

// GET /markups/:id - Get single markup
markupRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID inválido. O ID deve ser um número inteiro positivo.',
      });
    }

    const item = await getMarkupById(id);
    if (!item) {
      return res.status(404).json({
        error: `Markup com ID ${id} não encontrado.`,
      });
    }

    return res.status(200).json(item);
  } catch (error: any) {
    console.error(`Error in GET /markups/${req.params.id}:`, error);
    return res.status(500).json({
      error: 'Erro interno ao buscar markup.',
      message: error?.message || 'Falha na busca',
    });
  }
});

// POST /markups - Create new markup
markupRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { isValid, errors, sanitized } = validateMarkupData(req.body);

    if (!isValid || !sanitized) {
      return res.status(400).json({
        error: 'Dados de formulário inválidos.',
        details: errors,
      });
    }

    const novo = await createMarkup(sanitized);
    return res.status(201).json(novo);
  } catch (error: any) {
    console.error('Error in POST /markups:', error);
    const status = error.status || 500;
    return res.status(status).json({
      error: error?.message || 'Erro ao cadastrar markup.',
      details: error.field ? { [error.field]: error.message } : undefined,
    });
  }
});

// PUT /markups/:id - Update existing markup
markupRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID inválido. O ID deve ser um número inteiro positivo.',
      });
    }

    const existing = await getMarkupById(id);
    if (!existing) {
      return res.status(404).json({
        error: `Markup com ID ${id} não encontrado para atualização.`,
      });
    }

    const { isValid, errors, sanitized } = validateMarkupData(req.body);

    if (!isValid || !sanitized) {
      return res.status(400).json({
        error: 'Dados de formulário inválidos.',
        details: errors,
      });
    }

    const updated = await updateMarkup(id, sanitized);
    return res.status(200).json(updated);
  } catch (error: any) {
    console.error(`Error in PUT /markups/${req.params.id}:`, error);
    const status = error.status || 500;
    return res.status(status).json({
      error: error?.message || 'Erro ao atualizar markup.',
      details: error.field ? { [error.field]: error.message } : undefined,
    });
  }
});

// PATCH /markups/:id/status - Toggle status
markupRouter.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID inválido. O ID deve ser um número inteiro positivo.',
      });
    }

    const existing = await getMarkupById(id);
    if (!existing) {
      return res.status(404).json({
        error: `Markup com ID ${id} não encontrado.`,
      });
    }

    const explicitStatus = typeof req.body.ativo === 'boolean' ? req.body.ativo : undefined;
    const updated = await toggleStatusMarkup(id, explicitStatus);

    return res.status(200).json(updated);
  } catch (error: any) {
    console.error(`Error in PATCH /markups/${req.params.id}/status:`, error);
    return res.status(500).json({
      error: 'Erro interno ao alterar status do markup.',
      message: error?.message || 'Falha na alteração de status',
    });
  }
});

// DELETE /markups/:id - Physical delete
markupRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID inválido. O ID deve ser um número inteiro positivo.',
      });
    }

    const existing = await getMarkupById(id);
    if (!existing) {
      return res.status(404).json({
        error: `Markup com ID ${id} não encontrado para exclusão.`,
      });
    }

    const deleted = await deleteMarkup(id);
    if (!deleted) {
      return res.status(500).json({
        error: 'Não foi possível excluir o markup solicitado.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Markup '${existing.nome}' excluído com sucesso.`,
      id,
    });
  } catch (error: any) {
    console.error(`Error in DELETE /markups/${req.params.id}:`, error);
    return res.status(500).json({
      error: 'Erro interno ao excluir markup.',
      message: error?.message || 'Falha na exclusão',
    });
  }
});
