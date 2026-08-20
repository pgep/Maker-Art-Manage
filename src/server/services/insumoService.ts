import { eq, desc, asc, ilike, and, sql, ne } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import {
  insumos,
  tiposInsumo,
  unidadesMedida,
  type Insumo,
  type NovoInsumo,
} from '../../db/schema.ts';

export interface InsumoFilterOptions {
  search?: string;
  status?: 'todos' | 'ativos' | 'inativos' | string;
  page?: number;
  pageSize?: number;
  sortBy?:
    | 'id'
    | 'nome'
    | 'custoUnitarioBase'
    | 'quantidadeEstoque'
    | 'estoqueMinimo'
    | 'ativo'
    | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface InsumoDetail extends Insumo {
  tipoInsumoNome: string;
  unidadeMedidaNome: string;
  unidadeMedidaTipo: string;
  fatorConversao: number;
}

export async function checkInsumoNomeUniqueness(nome: string, excludeId?: number): Promise<boolean> {
  const trimmedNome = nome.trim().toLowerCase();

  const conditions = [sql`lower(${insumos.nome}) = ${trimmedNome}`];
  if (excludeId !== undefined) {
    conditions.push(ne(insumos.id, excludeId));
  }

  const existing = await db
    .select({ id: insumos.id })
    .from(insumos)
    .where(and(...conditions))
    .limit(1);

  return existing.length === 0;
}

export function validateInsumoData(
  data: Record<string, any>,
  isUpdate: boolean = false
): {
  isValid: boolean;
  errors: Record<string, string>;
  sanitized?: {
    nome: string;
    tipoInsumoId: number;
    unidadeMedidaId: number;
    quantidadeCompra: number;
    valorCompra: number;
    estoqueMinimo: number;
    ativo?: boolean;
  };
} {
  const errors: Record<string, string> = {};

  // Nome validation
  if (!data.nome || typeof data.nome !== 'string' || data.nome.trim().length === 0) {
    errors.nome = 'O nome do insumo é obrigatório.';
  } else if (data.nome.trim().length > 150) {
    errors.nome = 'O nome do insumo não pode exceder 150 caracteres.';
  }

  // Tipo de Insumo ID
  const tipoInsumoId = Number(data.tipoInsumoId);
  if (!data.tipoInsumoId || isNaN(tipoInsumoId) || tipoInsumoId <= 0) {
    errors.tipoInsumoId = 'Selecione um Tipo de Insumo válido.';
  }

  // Unidade de Medida ID
  const unidadeMedidaId = Number(data.unidadeMedidaId);
  if (!data.unidadeMedidaId || isNaN(unidadeMedidaId) || unidadeMedidaId <= 0) {
    errors.unidadeMedidaId = 'Selecione uma Unidade de Medida válida.';
  }

  // Quantidade de Compra
  const quantidadeCompra = Number(
    typeof data.quantidadeCompra === 'string'
      ? data.quantidadeCompra.replace(',', '.')
      : data.quantidadeCompra
  );
  if (data.quantidadeCompra === undefined || data.quantidadeCompra === null || isNaN(quantidadeCompra) || quantidadeCompra <= 0) {
    errors.quantidadeCompra = 'A quantidade de compra deve ser um número maior que zero.';
  }

  // Valor de Compra
  const valorCompra = Number(
    typeof data.valorCompra === 'string'
      ? data.valorCompra.replace(',', '.')
      : data.valorCompra
  );
  if (data.valorCompra === undefined || data.valorCompra === null || isNaN(valorCompra) || valorCompra <= 0) {
    errors.valorCompra = 'O valor da compra deve ser um número maior que zero.';
  }

  // Estoque Mínimo
  const estoqueMinimo = Number(
    typeof data.estoqueMinimo === 'string'
      ? data.estoqueMinimo.replace(',', '.')
      : data.estoqueMinimo
  );
  if (data.estoqueMinimo === undefined || data.estoqueMinimo === null || isNaN(estoqueMinimo) || estoqueMinimo < 0) {
    errors.estoqueMinimo = 'O estoque mínimo deve ser um número maior ou igual a zero.';
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
      tipoInsumoId,
      unidadeMedidaId,
      quantidadeCompra,
      valorCompra,
      estoqueMinimo,
      ativo,
    },
  };
}

export async function listInsumos(
  options: InsumoFilterOptions = {}
): Promise<PaginatedResult<InsumoDetail>> {
  try {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 10));
    const offset = (page - 1) * pageSize;

    const conditions = [];

    // Search by name
    if (options.search && options.search.trim()) {
      conditions.push(ilike(insumos.nome, `%${options.search.trim()}%`));
    }

    // Status filter: default to 'ativos'
    const status = options.status || 'ativos';
    if (status === 'ativos') {
      conditions.push(eq(insumos.ativo, true));
    } else if (status === 'inativos') {
      conditions.push(eq(insumos.ativo, false));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(insumos)
      .where(whereClause);

    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pageSize) || 1;

    // Sorting
    let orderByColumn;
    const sortOrder = options.sortOrder === 'asc' ? asc : desc;

    switch (options.sortBy) {
      case 'nome':
        orderByColumn = sortOrder(insumos.nome);
        break;
      case 'custoUnitarioBase':
        orderByColumn = sortOrder(insumos.custoUnitarioBase);
        break;
      case 'quantidadeEstoque':
        orderByColumn = sortOrder(insumos.quantidadeEstoque);
        break;
      case 'estoqueMinimo':
        orderByColumn = sortOrder(insumos.estoqueMinimo);
        break;
      case 'ativo':
        orderByColumn = sortOrder(insumos.ativo);
        break;
      case 'createdAt':
        orderByColumn = sortOrder(insumos.createdAt);
        break;
      case 'id':
      default:
        orderByColumn = sortOrder(insumos.id);
        break;
    }

    const rows = await db
      .select({
        id: insumos.id,
        nome: insumos.nome,
        tipoInsumoId: insumos.tipoInsumoId,
        unidadeMedidaId: insumos.unidadeMedidaId,
        quantidadeCompra: insumos.quantidadeCompra,
        valorCompra: insumos.valorCompra,
        quantidadeBase: insumos.quantidadeBase,
        custoUnitarioBase: insumos.custoUnitarioBase,
        quantidadeEstoque: insumos.quantidadeEstoque,
        estoqueMinimo: insumos.estoqueMinimo,
        ativo: insumos.ativo,
        createdAt: insumos.createdAt,
        updatedAt: insumos.updatedAt,
        tipoInsumoNome: tiposInsumo.nome,
        unidadeMedidaNome: unidadesMedida.nome,
        unidadeMedidaTipo: unidadesMedida.tipo,
        fatorConversao: unidadesMedida.fatorConversao,
      })
      .from(insumos)
      .leftJoin(tiposInsumo, eq(insumos.tipoInsumoId, tiposInsumo.id))
      .leftJoin(unidadesMedida, eq(insumos.unidadeMedidaId, unidadesMedida.id))
      .where(whereClause)
      .orderBy(orderByColumn)
      .limit(pageSize)
      .offset(offset);

    const data: InsumoDetail[] = rows.map((r) => ({
      id: r.id,
      nome: r.nome,
      tipoInsumoId: r.tipoInsumoId,
      unidadeMedidaId: r.unidadeMedidaId,
      quantidadeCompra: r.quantidadeCompra,
      valorCompra: r.valorCompra,
      quantidadeBase: r.quantidadeBase,
      custoUnitarioBase: r.custoUnitarioBase,
      quantidadeEstoque: r.quantidadeEstoque,
      estoqueMinimo: r.estoqueMinimo,
      ativo: r.ativo,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      tipoInsumoNome: r.tipoInsumoNome || 'Desconhecido',
      unidadeMedidaNome: r.unidadeMedidaNome || 'Desconhecida',
      unidadeMedidaTipo: r.unidadeMedidaTipo || 'Unidade',
      fatorConversao: r.fatorConversao || 1,
    }));

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    console.error('Error fetching insumos:', error);
    throw new Error('Falha ao consultar insumos no banco de dados.', { cause: error });
  }
}

export async function getInsumoById(id: number): Promise<InsumoDetail | null> {
  try {
    const rows = await db
      .select({
        id: insumos.id,
        nome: insumos.nome,
        tipoInsumoId: insumos.tipoInsumoId,
        unidadeMedidaId: insumos.unidadeMedidaId,
        quantidadeCompra: insumos.quantidadeCompra,
        valorCompra: insumos.valorCompra,
        quantidadeBase: insumos.quantidadeBase,
        custoUnitarioBase: insumos.custoUnitarioBase,
        quantidadeEstoque: insumos.quantidadeEstoque,
        estoqueMinimo: insumos.estoqueMinimo,
        ativo: insumos.ativo,
        createdAt: insumos.createdAt,
        updatedAt: insumos.updatedAt,
        tipoInsumoNome: tiposInsumo.nome,
        unidadeMedidaNome: unidadesMedida.nome,
        unidadeMedidaTipo: unidadesMedida.tipo,
        fatorConversao: unidadesMedida.fatorConversao,
      })
      .from(insumos)
      .leftJoin(tiposInsumo, eq(insumos.tipoInsumoId, tiposInsumo.id))
      .leftJoin(unidadesMedida, eq(insumos.unidadeMedidaId, unidadesMedida.id))
      .where(eq(insumos.id, id))
      .limit(1);

    if (!rows[0]) return null;

    const r = rows[0];
    return {
      id: r.id,
      nome: r.nome,
      tipoInsumoId: r.tipoInsumoId,
      unidadeMedidaId: r.unidadeMedidaId,
      quantidadeCompra: r.quantidadeCompra,
      valorCompra: r.valorCompra,
      quantidadeBase: r.quantidadeBase,
      custoUnitarioBase: r.custoUnitarioBase,
      quantidadeEstoque: r.quantidadeEstoque,
      estoqueMinimo: r.estoqueMinimo,
      ativo: r.ativo,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      tipoInsumoNome: r.tipoInsumoNome || 'Desconhecido',
      unidadeMedidaNome: r.unidadeMedidaNome || 'Desconhecida',
      unidadeMedidaTipo: r.unidadeMedidaTipo || 'Unidade',
      fatorConversao: r.fatorConversao || 1,
    };
  } catch (error) {
    console.error(`Error fetching insumo ID ${id}:`, error);
    throw new Error('Falha ao buscar insumo pelo ID.', { cause: error });
  }
}

export async function createInsumo(data: {
  nome: string;
  tipoInsumoId: number;
  unidadeMedidaId: number;
  quantidadeCompra: number;
  valorCompra: number;
  estoqueMinimo: number;
  ativo?: boolean;
}): Promise<InsumoDetail> {
  // 1. Verify Uniqueness
  const isUnique = await checkInsumoNomeUniqueness(data.nome);
  if (!isUnique) {
    const err: any = new Error(`Já existe um insumo cadastrado com o nome "${data.nome}".`);
    err.status = 400;
    err.field = 'nome';
    throw err;
  }

  // 2. Validate Tipo de Insumo Existence & Status
  const tipoInsumoResult = await db
    .select()
    .from(tiposInsumo)
    .where(eq(tiposInsumo.id, data.tipoInsumoId))
    .limit(1);

  if (tipoInsumoResult.length === 0) {
    const err: any = new Error('O Tipo de Insumo selecionado não existe.');
    err.status = 400;
    err.field = 'tipoInsumoId';
    throw err;
  }

  if (!tipoInsumoResult[0].ativo) {
    const err: any = new Error('Não é permitido vincular um Tipo de Insumo inativo a um novo insumo.');
    err.status = 400;
    err.field = 'tipoInsumoId';
    throw err;
  }

  // 3. Validate Unidade de Medida Existence
  const unidadeResult = await db
    .select()
    .from(unidadesMedida)
    .where(eq(unidadesMedida.id, data.unidadeMedidaId))
    .limit(1);

  if (unidadeResult.length === 0) {
    const err: any = new Error('A Unidade de Medida selecionada não existe.');
    err.status = 400;
    err.field = 'unidadeMedidaId';
    throw err;
  }

  const unidade = unidadeResult[0];

  // 4. Calculations:
  // quantidade_base = quantidade_compra * fator_conversao
  // custo_unitario_base = valor_compra / quantidade_base
  // quantidade_estoque = quantidade_base (Estoque inicial)
  const quantidadeBase = Number(data.quantidadeCompra) * Number(unidade.fatorConversao);
  if (quantidadeBase <= 0) {
    const err: any = new Error('O cálculo da quantidade base resultou em um valor inválido.');
    err.status = 400;
    throw err;
  }

  const custoUnitarioBase = Number(data.valorCompra) / quantidadeBase;
  const quantidadeEstoque = quantidadeBase;

  try {
    const inserted = await db
      .insert(insumos)
      .values({
        nome: data.nome.trim(),
        tipoInsumoId: data.tipoInsumoId,
        unidadeMedidaId: data.unidadeMedidaId,
        quantidadeCompra: data.quantidadeCompra,
        valorCompra: data.valorCompra,
        quantidadeBase,
        custoUnitarioBase,
        quantidadeEstoque,
        estoqueMinimo: data.estoqueMinimo,
        ativo: data.ativo !== undefined ? data.ativo : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const created = inserted[0];
    const fullDetail = await getInsumoById(created.id);
    return fullDetail!;
  } catch (error: any) {
    if (error?.code === '23505' || error?.message?.includes('unique') || error?.message?.includes('duplicate')) {
      const err: any = new Error(`Já existe um insumo cadastrado com o nome "${data.nome}".`);
      err.status = 400;
      err.field = 'nome';
      throw err;
    }
    console.error('Error creating insumo:', error);
    throw new Error('Falha ao cadastrar insumo no banco de dados.', { cause: error });
  }
}

export async function updateInsumo(
  id: number,
  data: {
    nome?: string;
    tipoInsumoId?: number;
    unidadeMedidaId?: number;
    quantidadeCompra?: number;
    valorCompra?: number;
    estoqueMinimo?: number;
    ativo?: boolean;
  }
): Promise<InsumoDetail | null> {
  const existing = await getInsumoById(id);
  if (!existing) {
    return null;
  }

  const updatePayload: Partial<NovoInsumo> = {
    updatedAt: new Date(),
  };

  // 1. Nome Uniqueness Check if changed
  if (data.nome !== undefined) {
    const isUnique = await checkInsumoNomeUniqueness(data.nome, id);
    if (!isUnique) {
      const err: any = new Error(`Já existe outro insumo cadastrado com o nome "${data.nome}".`);
      err.status = 400;
      err.field = 'nome';
      throw err;
    }
    updatePayload.nome = data.nome.trim();
  }

  // 2. Tipo de Insumo Check if changed
  if (data.tipoInsumoId !== undefined) {
    const tipoInsumoResult = await db
      .select()
      .from(tiposInsumo)
      .where(eq(tiposInsumo.id, data.tipoInsumoId))
      .limit(1);

    if (tipoInsumoResult.length === 0) {
      const err: any = new Error('O Tipo de Insumo selecionado não existe.');
      err.status = 400;
      err.field = 'tipoInsumoId';
      throw err;
    }

    updatePayload.tipoInsumoId = data.tipoInsumoId;
  }

  // 3. Unidade de Medida check & Conversions
  const targetUnidadeId = data.unidadeMedidaId !== undefined ? data.unidadeMedidaId : existing.unidadeMedidaId;
  const targetQtdCompra = data.quantidadeCompra !== undefined ? data.quantidadeCompra : existing.quantidadeCompra;
  const targetValorCompra = data.valorCompra !== undefined ? data.valorCompra : existing.valorCompra;

  const unidadeResult = await db
    .select()
    .from(unidadesMedida)
    .where(eq(unidadesMedida.id, targetUnidadeId))
    .limit(1);

  if (unidadeResult.length === 0) {
    const err: any = new Error('A Unidade de Medida selecionada não existe.');
    err.status = 400;
    err.field = 'unidadeMedidaId';
    throw err;
  }

  const unidade = unidadeResult[0];

  if (data.unidadeMedidaId !== undefined) {
    updatePayload.unidadeMedidaId = data.unidadeMedidaId;
  }
  if (data.quantidadeCompra !== undefined) {
    updatePayload.quantidadeCompra = data.quantidadeCompra;
  }
  if (data.valorCompra !== undefined) {
    updatePayload.valorCompra = data.valorCompra;
  }
  if (data.estoqueMinimo !== undefined) {
    updatePayload.estoqueMinimo = data.estoqueMinimo;
  }
  if (data.ativo !== undefined) {
    updatePayload.ativo = data.ativo;
  }

  // Recalculate quantidade_base and custo_unitario_base
  const novaQuantidadeBase = Number(targetQtdCompra) * Number(unidade.fatorConversao);
  if (novaQuantidadeBase <= 0) {
    const err: any = new Error('O cálculo da quantidade base resultou em um valor inválido.');
    err.status = 400;
    throw err;
  }

  const novoCustoUnitarioBase = Number(targetValorCompra) / novaQuantidadeBase;

  updatePayload.quantidadeBase = novaQuantidadeBase;
  updatePayload.custoUnitarioBase = novoCustoUnitarioBase;

  // IMPORTANT: quantidade_estoque is preserved on update (represents real stock)

  try {
    await db
      .update(insumos)
      .set(updatePayload)
      .where(eq(insumos.id, id));

    return await getInsumoById(id);
  } catch (error: any) {
    if (error?.code === '23505' || error?.message?.includes('unique') || error?.message?.includes('duplicate')) {
      const err: any = new Error(`Já existe outro insumo cadastrado com o nome "${data.nome}".`);
      err.status = 400;
      err.field = 'nome';
      throw err;
    }
    console.error(`Error updating insumo ID ${id}:`, error);
    throw new Error('Falha ao atualizar insumo no banco de dados.', { cause: error });
  }
}

export async function toggleStatusInsumo(id: number, explicitStatus?: boolean): Promise<InsumoDetail | null> {
  const existing = await getInsumoById(id);
  if (!existing) {
    return null;
  }

  const newStatus = explicitStatus !== undefined ? explicitStatus : !existing.ativo;

  try {
    await db
      .update(insumos)
      .set({
        ativo: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(insumos.id, id));

    return await getInsumoById(id);
  } catch (error) {
    console.error(`Error toggling status of insumo ID ${id}:`, error);
    throw new Error('Falha ao alterar status do insumo.', { cause: error });
  }
}

export async function deleteInsumo(id: number): Promise<boolean> {
  try {
    const result = await db
      .delete(insumos)
      .where(eq(insumos.id, id))
      .returning({ id: insumos.id });

    return result.length > 0;
  } catch (error) {
    console.error(`Error deleting insumo ID ${id}:`, error);
    throw new Error('Falha ao excluir insumo.', { cause: error });
  }
}
