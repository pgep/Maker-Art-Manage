import { Router, Request, Response } from 'express';
import {
  listProdutos,
  getProdutoById,
  createProduto,
  updateProduto,
  toggleStatusProduto,
  deleteProduto,
  validateProdutoData,
} from '../services/produtoService.ts';

export const produtoRouter = Router();

// GET /produtos - List with search, filter, pagination, sorting
produtoRouter.get('/', async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const tipoProdutoId =
      typeof req.query.tipoProdutoId === 'string' ? parseInt(req.query.tipoProdutoId, 10) : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : 'ativos';
    const page = typeof req.query.page === 'string' ? parseInt(req.query.page, 10) : 1;
    const pageSize = typeof req.query.pageSize === 'string' ? parseInt(req.query.pageSize, 10) : 10;
    const sortBy = typeof req.query.sortBy === 'string' ? (req.query.sortBy as any) : 'id';
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

    const result = await listProdutos({
      search,
      tipoProdutoId,
      status,
      page,
      pageSize,
      sortBy,
      sortOrder,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in GET /produtos:', error);
    return res.status(500).json({
      error: 'Erro interno ao consultar produtos.',
      message: error?.message || 'Falha na consulta',
    });
  }
});

// GET /produtos/:id - Get single product with full composition details
produtoRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID inválido. O ID deve ser um número inteiro positivo.',
      });
    }

    const item = await getProdutoById(id);
    if (!item) {
      return res.status(404).json({
        error: `Produto com ID ${id} não encontrado.`,
      });
    }

    return res.status(200).json(item);
  } catch (error: any) {
    console.error(`Error in GET /produtos/${req.params.id}:`, error);
    return res.status(500).json({
      error: 'Erro interno ao buscar produto.',
      message: error?.message || 'Falha na busca',
    });
  }
});

// POST /produtos - Create product and composition
produtoRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { isValid, errors, sanitized } = validateProdutoData(req.body);

    if (!isValid || !sanitized) {
      return res.status(400).json({
        error: 'Dados de formulário inválidos.',
        details: errors,
      });
    }

    const novo = await createProduto(sanitized);
    return res.status(201).json(novo);
  } catch (error: any) {
    console.error('Error in POST /produtos:', error);
    const status = error.status || 500;
    return res.status(status).json({
      error: error?.message || 'Erro ao cadastrar produto.',
      details: error.field ? { [error.field]: error.message } : undefined,
    });
  }
});

// PUT /produtos/:id - Update product and composition
produtoRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID inválido. O ID deve ser um número inteiro positivo.',
      });
    }

    const existing = await getProdutoById(id);
    if (!existing) {
      return res.status(404).json({
        error: `Produto com ID ${id} não encontrado para atualização.`,
      });
    }

    const { isValid, errors, sanitized } = validateProdutoData(req.body);

    if (!isValid || !sanitized) {
      return res.status(400).json({
        error: 'Dados de formulário inválidos.',
        details: errors,
      });
    }

    const updated = await updateProduto(id, sanitized);
    return res.status(200).json(updated);
  } catch (error: any) {
    console.error(`Error in PUT /produtos/${req.params.id}:`, error);
    const status = error.status || 500;
    return res.status(status).json({
      error: error?.message || 'Erro ao atualizar produto.',
      details: error.field ? { [error.field]: error.message } : undefined,
    });
  }
});

// PATCH /produtos/:id/status - Toggle status
produtoRouter.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID inválido. O ID deve ser um número inteiro positivo.',
      });
    }

    const existing = await getProdutoById(id);
    if (!existing) {
      return res.status(404).json({
        error: `Produto com ID ${id} não encontrado.`,
      });
    }

    const explicitStatus = typeof req.body.ativo === 'boolean' ? req.body.ativo : undefined;
    const updated = await toggleStatusProduto(id, explicitStatus);

    return res.status(200).json(updated);
  } catch (error: any) {
    console.error(`Error in PATCH /produtos/${req.params.id}/status:`, error);
    return res.status(500).json({
      error: 'Erro interno ao alterar status do produto.',
      message: error?.message || 'Falha na alteração de status',
    });
  }
});

// DELETE /produtos/:id - Delete product and composition in transaction
produtoRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID inválido. O ID deve ser um número inteiro positivo.',
      });
    }

    const existing = await getProdutoById(id);
    if (!existing) {
      return res.status(404).json({
        error: `Produto com ID ${id} não encontrado para exclusão.`,
      });
    }

    const deleted = await deleteProduto(id);
    if (!deleted) {
      return res.status(500).json({
        error: 'Não foi possível excluir o produto solicitado.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Produto '${existing.nome}' e sua composição foram excluídos com sucesso.`,
      id,
    });
  } catch (error: any) {
    console.error(`Error in DELETE /produtos/${req.params.id}:`, error);
    return res.status(500).json({
      error: 'Erro interno ao excluir produto.',
      message: error?.message || 'Falha na exclusão',
    });
  }
});
