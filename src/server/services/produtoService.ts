import { eq, desc, asc, ilike, and, sql, ne, inArray } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import {
  produtos,
  produtoInsumos,
  tiposProduto,
  markups,
  insumos,
  unidadesMedida,
  type Produto,
} from '../../db/schema.ts';

export interface ProdutoFilterOptions {
  search?: string;
  tipoProdutoId?: number;
  status?: 'todos' | 'ativos' | 'inativos' | string;
  page?: number;
  pageSize?: number;
  sortBy?: 'id' | 'nome' | 'tipoProdutoNome' | 'custoTotal' | 'precoSugerido' | 'precoVenda' | 'ativo' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProdutoInsumoDetailResult {
  id: number;
  produtoId: number;
  insumoId: number;
  quantidade: number;
  custoUnitarioBase: number;
  custoComponente: number;
  insumoNome: string;
  insumoAtivo: boolean;
  unidadeMedidaNome: string;
  unidadeMedidaTipo: string;
  fatorConversao: number;
}

export interface ProdutoDetailResult extends Omit<Produto, 'custoTotal' | 'precoSugerido' | 'precoVenda'> {
  custoTotal: number;
  precoSugerido: number;
  precoVenda: number;
  tipoProdutoNome: string;
  markupNome: string;
  markupFator: number;
  totalItensComposicao: number;
  itensComposicao: ProdutoInsumoDetailResult[];
}

export async function checkProdutoNomeUniqueness(nome: string, excludeId?: number): Promise<boolean> {
  const trimmedNome = nome.trim().toLowerCase();

  const conditions = [sql`lower(${produtos.nome}) = ${trimmedNome}`];
  if (excludeId !== undefined) {
    conditions.push(ne(produtos.id, excludeId));
  }

  const existing = await db
    .select({ id: produtos.id })
    .from(produtos)
    .where(and(...conditions))
    .limit(1);

  return existing.length === 0;
}

export interface ValidatedProdutoInput {
  nome: string;
  descricao?: string | null;
  tipoProdutoId: number;
  markupId: number;
  precoVenda: number;
  ativo: boolean;
  itensComposicao: Array<{
    insumoId: number;
    quantidade: number;
  }>;
}

export function validateProdutoData(data: Record<string, any>): {
  isValid: boolean;
  errors: Record<string, string>;
  sanitized?: ValidatedProdutoInput;
} {
  const errors: Record<string, string> = {};

  // 1. Nome
  if (!data.nome || typeof data.nome !== 'string' || data.nome.trim().length === 0) {
    errors.nome = 'O nome do produto é obrigatório.';
  } else if (data.nome.trim().length > 150) {
    errors.nome = 'O nome do produto não pode exceder 150 caracteres.';
  }

  // 2. Descricao
  const descricao =
    typeof data.descricao === 'string' && data.descricao.trim().length > 0
      ? data.descricao.trim()
      : null;

  // 3. Tipo de Produto
  const tipoProdutoId = parseInt(String(data.tipoProdutoId), 10);
  if (isNaN(tipoProdutoId) || tipoProdutoId <= 0) {
    errors.tipoProdutoId = 'O Tipo de Produto é obrigatório.';
  }

  // 4. Markup
  const markupId = parseInt(String(data.markupId), 10);
  if (isNaN(markupId) || markupId <= 0) {
    errors.markupId = 'O Markup é obrigatório.';
  }

  // 5. Preço de Venda
  let precoVendaNum = 0;
  if (data.precoVenda === undefined || data.precoVenda === null || String(data.precoVenda).trim() === '') {
    errors.precoVenda = 'O Preço de Venda é obrigatório.';
  } else {
    const rawPV = typeof data.precoVenda === 'string' ? data.precoVenda.replace(',', '.') : data.precoVenda;
    precoVendaNum = Number(rawPV);
    if (isNaN(precoVendaNum) || precoVendaNum <= 0) {
      errors.precoVenda = 'O Preço de Venda deve ser um valor monetário maior que zero.';
    }
  }

  // 6. Itens da Composição
  const rawItens = Array.isArray(data.itensComposicao) ? data.itensComposicao : [];
  const sanitizedItens: Array<{ insumoId: number; quantidade: number }> = [];

  if (rawItens.length === 0) {
    errors.itensComposicao = 'Adicione pelo menos um insumo à composição do produto.';
  } else {
    const seenInsumoIds = new Set<number>();

    for (let i = 0; i < rawItens.length; i++) {
      const item = rawItens[i];
      const insumoId = parseInt(String(item.insumoId), 10);

      if (isNaN(insumoId) || insumoId <= 0) {
        errors[`item_${i}_insumoId`] = `Item #${i + 1}: Insumo inválido ou não selecionado.`;
        continue;
      }

      if (seenInsumoIds.has(insumoId)) {
        errors[`item_${i}_insumoId`] = `O mesmo insumo não pode ser incluído mais de uma vez na composição.`;
        continue;
      }
      seenInsumoIds.add(insumoId);

      // Quantidade
      const qRaw = item.quantidade;
      const quantidade = Number(
        typeof qRaw === 'string' ? qRaw.replace(',', '.') : qRaw
      );

      if (isNaN(quantidade) || quantidade <= 0) {
        errors[`item_${i}_quantidade`] = `Item #${i + 1}: A quantidade deve ser um número maior que zero.`;
      } else {
        sanitizedItens.push({
          insumoId,
          quantidade,
        });
      }
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
      descricao,
      tipoProdutoId,
      markupId,
      precoVenda: precoVendaNum,
      ativo,
      itensComposicao: sanitizedItens,
    },
  };
}

export async function listProdutos(
  options: ProdutoFilterOptions = {}
): Promise<PaginatedResult<any>> {
  try {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 10));
    const offset = (page - 1) * pageSize;

    const conditions = [];

    // Search by name
    if (options.search && options.search.trim()) {
      conditions.push(ilike(produtos.nome, `%${options.search.trim()}%`));
    }

    // Filter by Tipo de Produto
    if (options.tipoProdutoId && options.tipoProdutoId > 0) {
      conditions.push(eq(produtos.tipoProdutoId, options.tipoProdutoId));
    }

    // Status filter: default to 'ativos'
    const status = options.status || 'ativos';
    if (status === 'ativos') {
      conditions.push(eq(produtos.ativo, true));
    } else if (status === 'inativos') {
      conditions.push(eq(produtos.ativo, false));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(produtos)
      .where(whereClause);

    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pageSize) || 1;

    // Sorting
    let orderByColumn;
    const sortOrder = options.sortOrder === 'asc' ? asc : desc;

    switch (options.sortBy) {
      case 'nome':
        orderByColumn = sortOrder(produtos.nome);
        break;
      case 'tipoProdutoNome':
        orderByColumn = sortOrder(tiposProduto.nome);
        break;
      case 'custoTotal':
        orderByColumn = sortOrder(produtos.custoTotal);
        break;
      case 'precoSugerido':
        orderByColumn = sortOrder(produtos.precoSugerido);
        break;
      case 'precoVenda':
        orderByColumn = sortOrder(produtos.precoVenda);
        break;
      case 'ativo':
        orderByColumn = sortOrder(produtos.ativo);
        break;
      case 'createdAt':
        orderByColumn = sortOrder(produtos.createdAt);
        break;
      case 'id':
      default:
        orderByColumn = sortOrder(produtos.id);
        break;
    }

    const rows = await db
      .select({
        id: produtos.id,
        nome: produtos.nome,
        descricao: produtos.descricao,
        tipoProdutoId: produtos.tipoProdutoId,
        markupId: produtos.markupId,
        custoTotal: produtos.custoTotal,
        precoSugerido: produtos.precoSugerido,
        precoVenda: produtos.precoVenda,
        ativo: produtos.ativo,
        createdAt: produtos.createdAt,
        updatedAt: produtos.updatedAt,
        tipoProdutoNome: tiposProduto.nome,
        markupNome: markups.nome,
        markupFator: markups.fator,
        totalItensComposicao: sql<number>`(
          SELECT count(*)::int FROM produto_insumos WHERE produto_insumos.produto_id = ${produtos.id}
        )`,
      })
      .from(produtos)
      .leftJoin(tiposProduto, eq(produtos.tipoProdutoId, tiposProduto.id))
      .leftJoin(markups, eq(produtos.markupId, markups.id))
      .where(whereClause)
      .orderBy(orderByColumn)
      .limit(pageSize)
      .offset(offset);

    const data = rows.map((r) => ({
      id: r.id,
      nome: r.nome,
      descricao: r.descricao,
      tipoProdutoId: r.tipoProdutoId,
      markupId: r.markupId,
      custoTotal: Number(r.custoTotal),
      precoSugerido: Number(r.precoSugerido),
      precoVenda: Number(r.precoVenda),
      ativo: r.ativo,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      tipoProdutoNome: r.tipoProdutoNome || 'Desconhecido',
      markupNome: r.markupNome || 'Desconhecido',
      markupFator: r.markupFator ? Number(r.markupFator) : 1,
      totalItensComposicao: Number(r.totalItensComposicao || 0),
    }));

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    console.error('Error fetching produtos:', error);
    throw new Error('Falha ao consultar produtos no banco de dados.', { cause: error });
  }
}

export async function getProdutoById(id: number): Promise<ProdutoDetailResult | null> {
  try {
    const rows = await db
      .select({
        id: produtos.id,
        nome: produtos.nome,
        descricao: produtos.descricao,
        tipoProdutoId: produtos.tipoProdutoId,
        markupId: produtos.markupId,
        custoTotal: produtos.custoTotal,
        precoSugerido: produtos.precoSugerido,
        precoVenda: produtos.precoVenda,
        ativo: produtos.ativo,
        createdAt: produtos.createdAt,
        updatedAt: produtos.updatedAt,
        tipoProdutoNome: tiposProduto.nome,
        markupNome: markups.nome,
        markupFator: markups.fator,
      })
      .from(produtos)
      .leftJoin(tiposProduto, eq(produtos.tipoProdutoId, tiposProduto.id))
      .leftJoin(markups, eq(produtos.markupId, markups.id))
      .where(eq(produtos.id, id))
      .limit(1);

    if (!rows[0]) return null;

    const r = rows[0];

    // Fetch composition items with joined insumo & unidade details
    const itemRows = await db
      .select({
        id: produtoInsumos.id,
        produtoId: produtoInsumos.produtoId,
        insumoId: produtoInsumos.insumoId,
        quantidade: produtoInsumos.quantidade,
        custoUnitarioBase: produtoInsumos.custoUnitarioBase,
        custoComponente: produtoInsumos.custoComponente,
        insumoNome: insumos.nome,
        insumoAtivo: insumos.ativo,
        unidadeMedidaNome: unidadesMedida.nome,
        unidadeMedidaTipo: unidadesMedida.tipo,
        fatorConversao: unidadesMedida.fatorConversao,
      })
      .from(produtoInsumos)
      .leftJoin(insumos, eq(produtoInsumos.insumoId, insumos.id))
      .leftJoin(unidadesMedida, eq(insumos.unidadeMedidaId, unidadesMedida.id))
      .where(eq(produtoInsumos.produtoId, id))
      .orderBy(asc(produtoInsumos.id));

    const itensComposicao: ProdutoInsumoDetailResult[] = itemRows.map((it) => ({
      id: it.id,
      produtoId: it.produtoId,
      insumoId: it.insumoId,
      quantidade: Number(it.quantidade),
      custoUnitarioBase: Number(it.custoUnitarioBase),
      custoComponente: Number(it.custoComponente),
      insumoNome: it.insumoNome || 'Insumo não encontrado',
      insumoAtivo: it.insumoAtivo ?? true,
      unidadeMedidaNome: it.unidadeMedidaNome || 'Unidade',
      unidadeMedidaTipo: it.unidadeMedidaTipo || 'Unidade',
      fatorConversao: it.fatorConversao || 1,
    }));

    return {
      id: r.id,
      nome: r.nome,
      descricao: r.descricao,
      tipoProdutoId: r.tipoProdutoId,
      markupId: r.markupId,
      custoTotal: Number(r.custoTotal),
      precoSugerido: Number(r.precoSugerido),
      precoVenda: Number(r.precoVenda),
      ativo: r.ativo,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      tipoProdutoNome: r.tipoProdutoNome || 'Desconhecido',
      markupNome: r.markupNome || 'Desconhecido',
      markupFator: r.markupFator ? Number(r.markupFator) : 1,
      totalItensComposicao: itensComposicao.length,
      itensComposicao,
    };
  } catch (error) {
    console.error(`Error fetching produto ID ${id}:`, error);
    throw new Error('Falha ao buscar produto pelo ID.', { cause: error });
  }
}

/**
 * Helper to validate foreign keys, fetch fresh insumo costs and calculate totals
 */
async function calculateProdutoFinancials(
  tipoProdutoId: number,
  markupId: number,
  itens: Array<{ insumoId: number; quantidade: number }>
) {
  // 1. Verify TipoProduto
  const tipoRows = await db
    .select({ id: tiposProduto.id, nome: tiposProduto.nome, ativo: tiposProduto.ativo })
    .from(tiposProduto)
    .where(eq(tiposProduto.id, tipoProdutoId))
    .limit(1);

  if (!tipoRows[0]) {
    const err: any = new Error('Tipo de Produto selecionado não foi encontrado.');
    err.status = 400;
    err.field = 'tipoProdutoId';
    throw err;
  }

  // 2. Verify Markup
  const markupRows = await db
    .select({ id: markups.id, nome: markups.nome, fator: markups.fator, ativo: markups.ativo })
    .from(markups)
    .where(eq(markups.id, markupId))
    .limit(1);

  if (!markupRows[0]) {
    const err: any = new Error('Markup selecionado não foi encontrado.');
    err.status = 400;
    err.field = 'markupId';
    throw err;
  }

  const markupFator = Number(markupRows[0].fator);
  if (isNaN(markupFator) || markupFator <= 0) {
    const err: any = new Error('O fator do Markup selecionado é inválido.');
    err.status = 400;
    err.field = 'markupId';
    throw err;
  }

  // 3. Fetch Insumos
  const insumoIds = itens.map((it) => it.insumoId);
  const insumoRows = await db
    .select({
      id: insumos.id,
      nome: insumos.nome,
      custoUnitarioBase: insumos.custoUnitarioBase,
      ativo: insumos.ativo,
    })
    .from(insumos)
    .where(inArray(insumos.id, insumoIds));

  const insumoMap = new Map(insumoRows.map((r) => [r.id, r]));

  // Calculate each component
  let custoTotalCalculado = 0;
  const calculatedItems = [];

  for (const item of itens) {
    const insumoDb = insumoMap.get(item.insumoId);
    if (!insumoDb) {
      const err: any = new Error(`Insumo ID ${item.insumoId} não foi encontrado no cadastro.`);
      err.status = 400;
      throw err;
    }

    const custoUnitarioBase = Number(insumoDb.custoUnitarioBase);
    const custoComponente = item.quantidade * custoUnitarioBase;
    custoTotalCalculado += custoComponente;

    calculatedItems.push({
      insumoId: item.insumoId,
      quantidade: item.quantidade,
      custoUnitarioBase,
      custoComponente,
    });
  }

  const precoSugeridoCalculado = custoTotalCalculado * markupFator;

  return {
    markupFator,
    custoTotal: custoTotalCalculado,
    precoSugerido: precoSugeridoCalculado,
    calculatedItems,
  };
}

export async function createProduto(data: ValidatedProdutoInput): Promise<ProdutoDetailResult> {
  // 1. Uniqueness check
  const isUnique = await checkProdutoNomeUniqueness(data.nome);
  if (!isUnique) {
    const err: any = new Error(`Já existe um produto cadastrado com o nome "${data.nome}".`);
    err.status = 400;
    err.field = 'nome';
    throw err;
  }

  // 2. Financial calculation
  const { custoTotal, precoSugerido, calculatedItems } = await calculateProdutoFinancials(
    data.tipoProdutoId,
    data.markupId,
    data.itensComposicao
  );

  // 3. Database transaction
  const createdProdutoId = await db.transaction(async (tx) => {
    const [insertedProduto] = await tx
      .insert(produtos)
      .values({
        nome: data.nome,
        descricao: data.descricao,
        tipoProdutoId: data.tipoProdutoId,
        markupId: data.markupId,
        custoTotal: custoTotal.toFixed(4),
        precoSugerido: precoSugerido.toFixed(4),
        precoVenda: data.precoVenda.toFixed(4),
        ativo: data.ativo,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Insert composition items
    if (calculatedItems.length > 0) {
      await tx.insert(produtoInsumos).values(
        calculatedItems.map((it) => ({
          produtoId: insertedProduto.id,
          insumoId: it.insumoId,
          quantidade: it.quantidade.toString(),
          custoUnitarioBase: it.custoUnitarioBase.toString(),
          custoComponente: it.custoComponente.toFixed(4),
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      );
    }

    return insertedProduto.id;
  });

  const fullDetail = await getProdutoById(createdProdutoId);
  if (!fullDetail) {
    throw new Error('Falha ao recuperar produto recém-criado.');
  }

  return fullDetail;
}

export async function updateProduto(
  id: number,
  data: ValidatedProdutoInput
): Promise<ProdutoDetailResult | null> {
  const existing = await getProdutoById(id);
  if (!existing) {
    return null;
  }

  // 1. Uniqueness check if name changes
  const isUnique = await checkProdutoNomeUniqueness(data.nome, id);
  if (!isUnique) {
    const err: any = new Error(`Já existe outro produto cadastrado com o nome "${data.nome}".`);
    err.status = 400;
    err.field = 'nome';
    throw err;
  }

  // 2. Financial calculation with fresh insumo costs
  const { custoTotal, precoSugerido, calculatedItems } = await calculateProdutoFinancials(
    data.tipoProdutoId,
    data.markupId,
    data.itensComposicao
  );

  // 3. Database transaction
  await db.transaction(async (tx) => {
    // Update produto record
    await tx
      .update(produtos)
      .set({
        nome: data.nome,
        descricao: data.descricao,
        tipoProdutoId: data.tipoProdutoId,
        markupId: data.markupId,
        custoTotal: custoTotal.toFixed(4),
        precoSugerido: precoSugerido.toFixed(4),
        precoVenda: data.precoVenda.toFixed(4),
        ativo: data.ativo,
        updatedAt: new Date(),
      })
      .where(eq(produtos.id, id));

    // Delete existing composition items
    await tx.delete(produtoInsumos).where(eq(produtoInsumos.produtoId, id));

    // Insert updated composition items
    if (calculatedItems.length > 0) {
      await tx.insert(produtoInsumos).values(
        calculatedItems.map((it) => ({
          produtoId: id,
          insumoId: it.insumoId,
          quantidade: it.quantidade.toString(),
          custoUnitarioBase: it.custoUnitarioBase.toString(),
          custoComponente: it.custoComponente.toFixed(4),
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      );
    }
  });

  return getProdutoById(id);
}

export async function toggleStatusProduto(id: number, explicitStatus?: boolean): Promise<Produto | null> {
  const existing = await getProdutoById(id);
  if (!existing) {
    return null;
  }

  const newStatus = explicitStatus !== undefined ? explicitStatus : !existing.ativo;

  try {
    const updated = await db
      .update(produtos)
      .set({
        ativo: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(produtos.id, id))
      .returning();

    return updated[0] || null;
  } catch (error) {
    console.error(`Error toggling status of produto ID ${id}:`, error);
    throw new Error('Falha ao alterar status do produto.', { cause: error });
  }
}

export async function deleteProduto(id: number): Promise<boolean> {
  try {
    return await db.transaction(async (tx) => {
      // Composition items have onDelete: cascade, but explicit delete in tx guarantees integrity
      await tx.delete(produtoInsumos).where(eq(produtoInsumos.produtoId, id));

      const result = await tx
        .delete(produtos)
        .where(eq(produtos.id, id))
        .returning({ id: produtos.id });

      return result.length > 0;
    });
  } catch (error) {
    console.error(`Error deleting produto ID ${id}:`, error);
    throw new Error('Falha ao excluir produto.', { cause: error });
  }
}
