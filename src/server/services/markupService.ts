import { eq, desc, asc, ilike, and, sql, ne } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { markups, type Markup, type NovoMarkup } from '../../db/schema.ts';

export interface MarkupFilterOptions {
  search?: string;
  status?: 'todos' | 'ativos' | 'inativos' | string;
  page?: number;
  pageSize?: number;
  sortBy?: 'id' | 'nome' | 'fator' | 'ativo' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function checkMarkupNomeUniqueness(nome: string, excludeId?: number): Promise<boolean> {
  const trimmedNome = nome.trim().toLowerCase();

  const conditions = [sql`lower(${markups.nome}) = ${trimmedNome}`];
  if (excludeId !== undefined) {
    conditions.push(ne(markups.id, excludeId));
  }

  const existing = await db
    .select({ id: markups.id })
    .from(markups)
    .where(and(...conditions))
    .limit(1);

  return existing.length === 0;
}

export function validateMarkupData(
  data: Record<string, any>
): {
  isValid: boolean;
  errors: Record<string, string>;
  sanitized?: {
    nome: string;
    fator: number;
    ativo?: boolean;
  };
} {
  const errors: Record<string, string> = {};

  // Nome validation
  if (!data.nome || typeof data.nome !== 'string' || data.nome.trim().length === 0) {
    errors.nome = 'O nome do markup é obrigatório.';
  } else if (data.nome.trim().length > 100) {
    errors.nome = 'O nome do markup não pode exceder 100 caracteres.';
  }

  // Fator validation
  const fatorRaw = data.fator;
  let fator: number;

  if (fatorRaw === undefined || fatorRaw === null || (typeof fatorRaw === 'string' && fatorRaw.trim() === '')) {
    errors.fator = 'O fator de markup é obrigatório.';
    fator = NaN;
  } else {
    fator = Number(
      typeof fatorRaw === 'string' ? fatorRaw.replace(',', '.') : fatorRaw
    );

    if (isNaN(fator) || fator <= 0) {
      errors.fator = 'O fator de markup deve ser um número maior que zero.';
    }
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
      fator,
      ativo,
    },
  };
}

export async function listMarkups(
  options: MarkupFilterOptions = {}
): Promise<PaginatedResult<Markup>> {
  try {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 10));
    const offset = (page - 1) * pageSize;

    const conditions = [];

    // Search by name
    if (options.search && options.search.trim()) {
      conditions.push(ilike(markups.nome, `%${options.search.trim()}%`));
    }

    // Status filter: default to 'ativos'
    const status = options.status || 'ativos';
    if (status === 'ativos') {
      conditions.push(eq(markups.ativo, true));
    } else if (status === 'inativos') {
      conditions.push(eq(markups.ativo, false));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(markups)
      .where(whereClause);

    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pageSize) || 1;

    // Sorting
    let orderByColumn;
    const sortOrder = options.sortOrder === 'asc' ? asc : desc;

    switch (options.sortBy) {
      case 'nome':
        orderByColumn = sortOrder(markups.nome);
        break;
      case 'fator':
        orderByColumn = sortOrder(markups.fator);
        break;
      case 'ativo':
        orderByColumn = sortOrder(markups.ativo);
        break;
      case 'createdAt':
        orderByColumn = sortOrder(markups.createdAt);
        break;
      case 'id':
      default:
        orderByColumn = sortOrder(markups.id);
        break;
    }

    const data = await db
      .select()
      .from(markups)
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
    console.error('Error fetching markups:', error);
    throw new Error('Falha ao consultar markups no banco de dados.', { cause: error });
  }
}

export async function getMarkupById(id: number): Promise<Markup | null> {
  try {
    const rows = await db
      .select()
      .from(markups)
      .where(eq(markups.id, id))
      .limit(1);

    return rows[0] || null;
  } catch (error) {
    console.error(`Error fetching markup ID ${id}:`, error);
    throw new Error('Falha ao buscar markup pelo ID.', { cause: error });
  }
}

export async function createMarkup(data: {
  nome: string;
  fator: number;
  ativo?: boolean;
}): Promise<Markup> {
  // 1. Check Uniqueness
  const isUnique = await checkMarkupNomeUniqueness(data.nome);
  if (!isUnique) {
    const err: any = new Error(`Já existe um markup cadastrado com o nome "${data.nome}".`);
    err.status = 400;
    err.field = 'nome';
    throw err;
  }

  try {
    const inserted = await db
      .insert(markups)
      .values({
        nome: data.nome.trim(),
        fator: data.fator.toString(),
        ativo: data.ativo !== undefined ? data.ativo : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return inserted[0];
  } catch (error: any) {
    if (error?.code === '23505' || error?.message?.includes('unique') || error?.message?.includes('duplicate')) {
      const err: any = new Error(`Já existe um markup cadastrado com o nome "${data.nome}".`);
      err.status = 400;
      err.field = 'nome';
      throw err;
    }
    console.error('Error creating markup:', error);
    throw new Error('Falha ao cadastrar markup no banco de dados.', { cause: error });
  }
}

export async function updateMarkup(
  id: number,
  data: {
    nome?: string;
    fator?: number;
    ativo?: boolean;
  }
): Promise<Markup | null> {
  const existing = await getMarkupById(id);
  if (!existing) {
    return null;
  }

  const updatePayload: Partial<NovoMarkup> = {
    updatedAt: new Date(),
  };

  // Check uniqueness if nome is changing
  if (data.nome !== undefined) {
    const isUnique = await checkMarkupNomeUniqueness(data.nome, id);
    if (!isUnique) {
      const err: any = new Error(`Já existe outro markup cadastrado com o nome "${data.nome}".`);
      err.status = 400;
      err.field = 'nome';
      throw err;
    }
    updatePayload.nome = data.nome.trim();
  }

  if (data.fator !== undefined) {
    updatePayload.fator = data.fator.toString();
  }

  if (data.ativo !== undefined) {
    updatePayload.ativo = data.ativo;
  }

  try {
    const updated = await db
      .update(markups)
      .set(updatePayload)
      .where(eq(markups.id, id))
      .returning();

    return updated[0] || null;
  } catch (error: any) {
    if (error?.code === '23505' || error?.message?.includes('unique') || error?.message?.includes('duplicate')) {
      const err: any = new Error(`Já existe outro markup cadastrado com o nome "${data.nome}".`);
      err.status = 400;
      err.field = 'nome';
      throw err;
    }
    console.error(`Error updating markup ID ${id}:`, error);
    throw new Error('Falha ao atualizar markup no banco de dados.', { cause: error });
  }
}

export async function toggleStatusMarkup(id: number, explicitStatus?: boolean): Promise<Markup | null> {
  const existing = await getMarkupById(id);
  if (!existing) {
    return null;
  }

  const newStatus = explicitStatus !== undefined ? explicitStatus : !existing.ativo;

  try {
    const updated = await db
      .update(markups)
      .set({
        ativo: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(markups.id, id))
      .returning();

    return updated[0] || null;
  } catch (error) {
    console.error(`Error toggling status of markup ID ${id}:`, error);
    throw new Error('Falha ao alterar status do markup.', { cause: error });
  }
}

export async function deleteMarkup(id: number): Promise<boolean> {
  try {
    const result = await db
      .delete(markups)
      .where(eq(markups.id, id))
      .returning({ id: markups.id });

    return result.length > 0;
  } catch (error) {
    console.error(`Error deleting markup ID ${id}:`, error);
    throw new Error('Falha ao excluir markup.', { cause: error });
  }
}
