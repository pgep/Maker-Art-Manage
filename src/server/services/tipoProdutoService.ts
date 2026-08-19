import { eq, desc, asc, ilike, and, sql, not, ne } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { tiposProduto, type TipoProduto, type NovoTipoProduto } from '../../db/schema.ts';

export interface TipoProdutoFilterOptions {
  search?: string;
  status?: 'todos' | 'ativos' | 'inativos' | string;
  page?: number;
  pageSize?: number;
  sortBy?: 'id' | 'nome' | 'ativo' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function checkNomeUniqueness(nome: string, excludeId?: number): Promise<boolean> {
  const trimmedNome = nome.trim().toLowerCase();
  
  const conditions = [sql`lower(${tiposProduto.nome}) = ${trimmedNome}`];
  if (excludeId !== undefined) {
    conditions.push(ne(tiposProduto.id, excludeId));
  }

  const existing = await db
    .select({ id: tiposProduto.id })
    .from(tiposProduto)
    .where(and(...conditions))
    .limit(1);

  return existing.length === 0;
}

export function validateTipoProdutoData(
  data: { nome?: unknown; ativo?: unknown }
): {
  isValid: boolean;
  errors: Record<string, string>;
  sanitized?: { nome: string; ativo: boolean };
} {
  const errors: Record<string, string> = {};

  // Nome validation
  if (!data.nome || typeof data.nome !== 'string' || data.nome.trim().length === 0) {
    errors.nome = 'O nome do tipo de produto é obrigatório.';
  } else if (data.nome.trim().length > 100) {
    errors.nome = 'O nome não pode exceder 100 caracteres.';
  }

  const ativo = data.ativo !== undefined ? Boolean(data.ativo) : true;

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: {},
    sanitized: {
      nome: (data.nome as string).trim(),
      ativo,
    },
  };
}

export async function listTiposProduto(
  options: TipoProdutoFilterOptions = {}
): Promise<PaginatedResult<TipoProduto>> {
  try {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 10));
    const offset = (page - 1) * pageSize;

    const conditions = [];

    // Search filter
    if (options.search && options.search.trim()) {
      conditions.push(ilike(tiposProduto.nome, `%${options.search.trim()}%`));
    }

    // Status filter: default to 'ativos' if not explicitly provided or if 'ativos' is specified
    const status = options.status || 'ativos';
    if (status === 'ativos') {
      conditions.push(eq(tiposProduto.ativo, true));
    } else if (status === 'inativos') {
      conditions.push(eq(tiposProduto.ativo, false));
    }
    // if status is 'todos', we don't add status condition

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tiposProduto)
      .where(whereClause);

    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pageSize) || 1;

    // Sort order
    let orderByColumn;
    const sortOrder = options.sortOrder === 'asc' ? asc : desc;

    switch (options.sortBy) {
      case 'nome':
        orderByColumn = sortOrder(tiposProduto.nome);
        break;
      case 'ativo':
        orderByColumn = sortOrder(tiposProduto.ativo);
        break;
      case 'createdAt':
        orderByColumn = sortOrder(tiposProduto.createdAt);
        break;
      case 'id':
      default:
        orderByColumn = sortOrder(tiposProduto.id);
        break;
    }

    const data = await db
      .select()
      .from(tiposProduto)
      .where(whereClause)
      .orderBy(orderByColumn)
      .limit(pageSize)
      .offset(offset);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    console.error('Error fetching tipos de produto:', error);
    throw new Error('Falha ao consultar tipos de produto no banco de dados.', { cause: error });
  }
}

export async function getTipoProdutoById(id: number): Promise<TipoProduto | null> {
  try {
    const results = await db
      .select()
      .from(tiposProduto)
      .where(eq(tiposProduto.id, id))
      .limit(1);

    return results[0] || null;
  } catch (error) {
    console.error(`Error fetching tipo de produto ID ${id}:`, error);
    throw new Error('Falha ao buscar tipo de produto pelo ID.', { cause: error });
  }
}

export async function createTipoProduto(data: { nome: string; ativo?: boolean }): Promise<TipoProduto> {
  const isUnique = await checkNomeUniqueness(data.nome);
  if (!isUnique) {
    const err: any = new Error(`Já existe um tipo de produto cadastrado com o nome "${data.nome}".`);
    err.status = 400;
    err.field = 'nome';
    throw err;
  }

  try {
    const inserted = await db
      .insert(tiposProduto)
      .values({
        nome: data.nome.trim(),
        ativo: data.ativo !== undefined ? data.ativo : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return inserted[0];
  } catch (error: any) {
    // Catch database unique index error if race condition
    if (error?.code === '23505' || error?.message?.includes('unique') || error?.message?.includes('duplicate')) {
      const err: any = new Error(`Já existe um tipo de produto cadastrado com o nome "${data.nome}".`);
      err.status = 400;
      err.field = 'nome';
      throw err;
    }
    console.error('Error inserting tipo de produto:', error);
    throw new Error('Falha ao cadastrar tipo de produto.', { cause: error });
  }
}

export async function updateTipoProduto(
  id: number,
  data: { nome?: string; ativo?: boolean }
): Promise<TipoProduto | null> {
  const existing = await getTipoProdutoById(id);
  if (!existing) {
    return null;
  }

  const updatePayload: Partial<NovoTipoProduto> = {
    updatedAt: new Date(),
  };

  if (data.nome !== undefined) {
    const isUnique = await checkNomeUniqueness(data.nome, id);
    if (!isUnique) {
      const err: any = new Error(`Já existe outro tipo de produto cadastrado com o nome "${data.nome}".`);
      err.status = 400;
      err.field = 'nome';
      throw err;
    }
    updatePayload.nome = data.nome.trim();
  }

  if (data.ativo !== undefined) {
    updatePayload.ativo = data.ativo;
  }

  try {
    const updated = await db
      .update(tiposProduto)
      .set(updatePayload)
      .where(eq(tiposProduto.id, id))
      .returning();

    return updated[0] || null;
  } catch (error: any) {
    if (error?.code === '23505' || error?.message?.includes('unique') || error?.message?.includes('duplicate')) {
      const err: any = new Error(`Já existe outro tipo de produto cadastrado com o nome "${data.nome}".`);
      err.status = 400;
      err.field = 'nome';
      throw err;
    }
    console.error(`Error updating tipo de produto ID ${id}:`, error);
    throw new Error('Falha ao atualizar tipo de produto.', { cause: error });
  }
}

export async function toggleStatusTipoProduto(id: number, explicitStatus?: boolean): Promise<TipoProduto | null> {
  const existing = await getTipoProdutoById(id);
  if (!existing) {
    return null;
  }

  const newStatus = explicitStatus !== undefined ? explicitStatus : !existing.ativo;

  try {
    const updated = await db
      .update(tiposProduto)
      .set({
        ativo: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(tiposProduto.id, id))
      .returning();

    return updated[0] || null;
  } catch (error) {
    console.error(`Error toggling status of tipo de produto ID ${id}:`, error);
    throw new Error('Falha ao alterar o status do tipo de produto.', { cause: error });
  }
}

export async function deleteTipoProduto(id: number): Promise<boolean> {
  try {
    const result = await db
      .delete(tiposProduto)
      .where(eq(tiposProduto.id, id))
      .returning({ id: tiposProduto.id });

    return result.length > 0;
  } catch (error) {
    console.error(`Error deleting tipo de produto ID ${id}:`, error);
    throw new Error('Falha ao excluir tipo de produto.', { cause: error });
  }
}
