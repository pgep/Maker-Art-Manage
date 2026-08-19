import { eq, desc, asc, ilike, and, sql, or } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { unidadesMedida, type UnidadeMedida } from '../../db/schema.ts';

export const ALLOWED_TIPOS = ['Volume', 'Comprimento', 'Massa', 'Unidade'] as const;
export type TipoUnidade = typeof ALLOWED_TIPOS[number];

export interface UnidadeFilterOptions {
  search?: string;
  tipo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'id' | 'nome' | 'tipo' | 'fatorConversao' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function validateUnidadeMedidaData(data: { nome?: unknown; tipo?: unknown; fatorConversao?: unknown }): {
  isValid: boolean;
  errors: Record<string, string>;
  sanitized?: { nome: string; tipo: TipoUnidade; fatorConversao: number };
} {
  const errors: Record<string, string> = {};

  // Nome validation
  if (!data.nome || typeof data.nome !== 'string' || data.nome.trim().length === 0) {
    errors.nome = 'O nome da unidade de medida é obrigatório.';
  } else if (data.nome.trim().length > 50) {
    errors.nome = 'O nome não pode exceder 50 caracteres.';
  }

  // Tipo validation
  if (!data.tipo || typeof data.tipo !== 'string') {
    errors.tipo = 'O tipo da unidade de medida é obrigatório.';
  } else {
    const matchedTipo = ALLOWED_TIPOS.find((t) => t.toLowerCase() === (data.tipo as string).trim().toLowerCase());
    if (!matchedTipo) {
      errors.tipo = `Tipo inválido. Valores permitidos: ${ALLOWED_TIPOS.join(', ')}.`;
    }
  }

  // Fator conversao validation
  const numFator = typeof data.fatorConversao === 'string' ? parseFloat(data.fatorConversao) : Number(data.fatorConversao);
  if (isNaN(numFator)) {
    errors.fatorConversao = 'O fator de conversão deve ser um número válido.';
  } else if (numFator <= 0) {
    errors.fatorConversao = 'O fator de conversão deve ser estritamente maior que zero.';
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  const matchedTipo = ALLOWED_TIPOS.find((t) => t.toLowerCase() === (data.tipo as string).trim().toLowerCase())!;

  return {
    isValid: true,
    errors: {},
    sanitized: {
      nome: (data.nome as string).trim(),
      tipo: matchedTipo,
      fatorConversao: numFator,
    },
  };
}

export async function listUnidadesMedida(options: UnidadeFilterOptions = {}): Promise<PaginatedResult<UnidadeMedida>> {
  try {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 10));
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (options.search && options.search.trim()) {
      const searchPattern = `%${options.search.trim()}%`;
      conditions.push(
        or(
          ilike(unidadesMedida.nome, searchPattern),
          ilike(unidadesMedida.tipo, searchPattern)
        )
      );
    }

    if (options.tipo && options.tipo.trim() && options.tipo !== 'todos') {
      conditions.push(eq(unidadesMedida.tipo, options.tipo.trim()));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(unidadesMedida)
      .where(whereClause);

    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pageSize) || 1;

    // Determine sorting
    let orderByColumn;
    const sortOrder = options.sortOrder === 'asc' ? asc : desc;

    switch (options.sortBy) {
      case 'nome':
        orderByColumn = sortOrder(unidadesMedida.nome);
        break;
      case 'tipo':
        orderByColumn = sortOrder(unidadesMedida.tipo);
        break;
      case 'fatorConversao':
        orderByColumn = sortOrder(unidadesMedida.fatorConversao);
        break;
      case 'createdAt':
        orderByColumn = sortOrder(unidadesMedida.createdAt);
        break;
      case 'id':
      default:
        orderByColumn = sortOrder(unidadesMedida.id);
        break;
    }

    const data = await db
      .select()
      .from(unidadesMedida)
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
    console.error('Error fetching unidades de medida:', error);
    throw new Error('Falha ao consultar unidades de medida no banco de dados.', { cause: error });
  }
}

export async function getUnidadeMedidaById(id: number): Promise<UnidadeMedida | null> {
  try {
    const results = await db
      .select()
      .from(unidadesMedida)
      .where(eq(unidadesMedida.id, id))
      .limit(1);

    return results[0] || null;
  } catch (error) {
    console.error(`Error fetching unidade de medida ID ${id}:`, error);
    throw new Error('Falha ao buscar unidade de medida pelo ID.', { cause: error });
  }
}

export async function createUnidadeMedida(data: {
  nome: string;
  tipo: TipoUnidade;
  fatorConversao: number;
}): Promise<UnidadeMedida> {
  try {
    const inserted = await db
      .insert(unidadesMedida)
      .values({
        nome: data.nome,
        tipo: data.tipo,
        fatorConversao: data.fatorConversao,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Error inserting unidade de medida:', error);
    throw new Error('Falha ao cadastrar unidade de medida.', { cause: error });
  }
}

export async function updateUnidadeMedida(
  id: number,
  data: {
    nome: string;
    tipo: TipoUnidade;
    fatorConversao: number;
  }
): Promise<UnidadeMedida | null> {
  try {
    const updated = await db
      .update(unidadesMedida)
      .set({
        nome: data.nome,
        tipo: data.tipo,
        fatorConversao: data.fatorConversao,
        updatedAt: new Date(),
      })
      .where(eq(unidadesMedida.id, id))
      .returning();

    return updated[0] || null;
  } catch (error) {
    console.error(`Error updating unidade de medida ID ${id}:`, error);
    throw new Error('Falha ao atualizar unidade de medida.', { cause: error });
  }
}

export async function deleteUnidadeMedida(id: number): Promise<boolean> {
  try {
    const result = await db
      .delete(unidadesMedida)
      .where(eq(unidadesMedida.id, id))
      .returning({ id: unidadesMedida.id });

    return result.length > 0;
  } catch (error) {
    console.error(`Error deleting unidade de medida ID ${id}:`, error);
    throw new Error('Falha ao excluir unidade de medida.', { cause: error });
  }
}

