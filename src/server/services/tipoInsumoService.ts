import { eq, desc, asc, ilike, and, sql, ne } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { tiposInsumo, type TipoInsumo, type NovoTipoInsumo } from '../../db/schema.ts';

export interface TipoInsumoFilterOptions {
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

  const conditions = [sql`lower(${tiposInsumo.nome}) = ${trimmedNome}`];
  if (excludeId !== undefined) {
    conditions.push(ne(tiposInsumo.id, excludeId));
  }

  const existing = await db
    .select({ id: tiposInsumo.id })
    .from(tiposInsumo)
    .where(and(...conditions))
    .limit(1);

  return existing.length === 0;
}

export function validateTipoInsumoData(
  data: { nome?: unknown; ativo?: unknown }
): {
  isValid: boolean;
  errors: Record<string, string>;
  sanitized?: { nome: string; ativo: boolean };
} {
  const errors: Record<string, string> = {};

  // Nome validation
  if (!data.nome || typeof data.nome !== 'string' || data.nome.trim().length === 0) {
    errors.nome = 'O nome do tipo de insumo é obrigatório.';
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

export async function listTiposInsumo(
  options: TipoInsumoFilterOptions = {}
): Promise<PaginatedResult<TipoInsumo>> {
  try {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 10));
    const offset = (page - 1) * pageSize;

    const conditions = [];

    // Search filter
    if (options.search && options.search.trim()) {
      conditions.push(ilike(tiposInsumo.nome, `%${options.search.trim()}%`));
    }

    // Status filter: default to 'ativos'
    const status = options.status || 'ativos';
    if (status === 'ativos') {
      conditions.push(eq(tiposInsumo.ativo, true));
    } else if (status === 'inativos') {
      conditions.push(eq(tiposInsumo.ativo, false));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tiposInsumo)
      .where(whereClause);

    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pageSize) || 1;

    // Sort order
    let orderByColumn;
    const sortOrder = options.sortOrder === 'asc' ? asc : desc;

    switch (options.sortBy) {
      case 'nome':
        orderByColumn = sortOrder(tiposInsumo.nome);
        break;
      case 'ativo':
        orderByColumn = sortOrder(tiposInsumo.ativo);
        break;
      case 'createdAt':
        orderByColumn = sortOrder(tiposInsumo.createdAt);
        break;
      case 'id':
      default:
        orderByColumn = sortOrder(tiposInsumo.id);
        break;
    }

    const data = await db
      .select()
      .from(tiposInsumo)
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
    console.error('Error fetching tipos de insumo:', error);
    throw new Error('Falha ao consultar tipos de insumo no banco de dados.', { cause: error });
  }
}

export async function getTipoInsumoById(id: number): Promise<TipoInsumo | null> {
  try {
    const results = await db
      .select()
      .from(tiposInsumo)
      .where(eq(tiposInsumo.id, id))
      .limit(1);

    return results[0] || null;
  } catch (error) {
    console.error(`Error fetching tipo de insumo ID ${id}:`, error);
    throw new Error('Falha ao buscar tipo de insumo pelo ID.', { cause: error });
  }
}

export async function createTipoInsumo(data: { nome: string; ativo?: boolean }): Promise<TipoInsumo> {
  const isUnique = await checkNomeUniqueness(data.nome);
  if (!isUnique) {
    const err: any = new Error(`Já existe um tipo de insumo cadastrado com o nome "${data.nome}".`);
    err.status = 400;
    err.field = 'nome';
    throw err;
  }

  try {
    const inserted = await db
      .insert(tiposInsumo)
      .values({
        nome: data.nome.trim(),
        ativo: data.ativo !== undefined ? data.ativo : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return inserted[0];
  } catch (error: any) {
    if (error?.code === '23505' || error?.message?.includes('unique') || error?.message?.includes('duplicate')) {
      const err: any = new Error(`Já existe um tipo de insumo cadastrado com o nome "${data.nome}".`);
      err.status = 400;
      err.field = 'nome';
      throw err;
    }
    console.error('Error inserting tipo de insumo:', error);
    throw new Error('Falha ao cadastrar tipo de insumo.', { cause: error });
  }
}

export async function updateTipoInsumo(
  id: number,
  data: { nome?: string; ativo?: boolean }
): Promise<TipoInsumo | null> {
  const existing = await getTipoInsumoById(id);
  if (!existing) {
    return null;
  }

  const updatePayload: Partial<NovoTipoInsumo> = {
    updatedAt: new Date(),
  };

  if (data.nome !== undefined) {
    const isUnique = await checkNomeUniqueness(data.nome, id);
    if (!isUnique) {
      const err: any = new Error(`Já existe outro tipo de insumo cadastrado com o nome "${data.nome}".`);
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
      .update(tiposInsumo)
      .set(updatePayload)
      .where(eq(tiposInsumo.id, id))
      .returning();

    return updated[0] || null;
  } catch (error: any) {
    if (error?.code === '23505' || error?.message?.includes('unique') || error?.message?.includes('duplicate')) {
      const err: any = new Error(`Já existe outro tipo de insumo cadastrado com o nome "${data.nome}".`);
      err.status = 400;
      err.field = 'nome';
      throw err;
    }
    console.error(`Error updating tipo de insumo ID ${id}:`, error);
    throw new Error('Falha ao atualizar tipo de insumo.', { cause: error });
  }
}

export async function toggleStatusTipoInsumo(id: number, explicitStatus?: boolean): Promise<TipoInsumo | null> {
  const existing = await getTipoInsumoById(id);
  if (!existing) {
    return null;
  }

  const newStatus = explicitStatus !== undefined ? explicitStatus : !existing.ativo;

  try {
    const updated = await db
      .update(tiposInsumo)
      .set({
        ativo: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(tiposInsumo.id, id))
      .returning();

    return updated[0] || null;
  } catch (error) {
    console.error(`Error toggling status of tipo de insumo ID ${id}:`, error);
    throw new Error('Falha ao alterar o status do tipo de insumo.', { cause: error });
  }
}

export async function deleteTipoInsumo(id: number): Promise<boolean> {
  try {
    const result = await db
      .delete(tiposInsumo)
      .where(eq(tiposInsumo.id, id))
      .returning({ id: tiposInsumo.id });

    return result.length > 0;
  } catch (error) {
    console.error(`Error deleting tipo de insumo ID ${id}:`, error);
    throw new Error('Falha ao excluir tipo de insumo.', { cause: error });
  }
}
