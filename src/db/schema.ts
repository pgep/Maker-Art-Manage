import { pgTable, serial, varchar, doublePrecision, timestamp, boolean, uniqueIndex, integer, numeric, text } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const unidadesMedida = pgTable('unidades_medida', {
  id: serial('id').primaryKey(),
  nome: varchar('nome', { length: 50 }).notNull(),
  tipo: varchar('tipo', { length: 20 }).notNull(),
  fatorConversao: doublePrecision('fator_conversao').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UnidadeMedida = typeof unidadesMedida.$inferSelect;
export type NovaUnidadeMedida = typeof unidadesMedida.$inferInsert;

export const tiposProduto = pgTable(
  'tipos_produto',
  {
    id: serial('id').primaryKey(),
    nome: varchar('nome', { length: 100 }).notNull(),
    ativo: boolean('ativo').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('tipos_produto_nome_lower_unique_idx').on(sql`lower(${table.nome})`),
  ]
);

export type TipoProduto = typeof tiposProduto.$inferSelect;
export type NovoTipoProduto = typeof tiposProduto.$inferInsert;

export const tiposInsumo = pgTable(
  'tipos_insumo',
  {
    id: serial('id').primaryKey(),
    nome: varchar('nome', { length: 100 }).notNull(),
    ativo: boolean('ativo').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('tipos_insumo_nome_lower_unique_idx').on(sql`lower(${table.nome})`),
  ]
);

export type TipoInsumo = typeof tiposInsumo.$inferSelect;
export type NovoTipoInsumo = typeof tiposInsumo.$inferInsert;

export const insumos = pgTable(
  'insumos',
  {
    id: serial('id').primaryKey(),
    nome: varchar('nome', { length: 150 }).notNull(),
    tipoInsumoId: integer('tipo_insumo_id')
      .notNull()
      .references(() => tiposInsumo.id),
    unidadeMedidaId: integer('unidade_medida_id')
      .notNull()
      .references(() => unidadesMedida.id),
    quantidadeCompra: doublePrecision('quantidade_compra').notNull(),
    valorCompra: doublePrecision('valor_compra').notNull(),
    quantidadeBase: doublePrecision('quantidade_base').notNull(),
    custoUnitarioBase: doublePrecision('custo_unitario_base').notNull(),
    quantidadeEstoque: doublePrecision('quantidade_estoque').notNull(),
    estoqueMinimo: doublePrecision('estoque_minimo').notNull(),
    ativo: boolean('ativo').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('insumos_nome_lower_unique_idx').on(sql`lower(${table.nome})`),
  ]
);

export type Insumo = typeof insumos.$inferSelect;
export type NovoInsumo = typeof insumos.$inferInsert;

export const markups = pgTable(
  'markups',
  {
    id: serial('id').primaryKey(),
    nome: varchar('nome', { length: 100 }).notNull(),
    fator: numeric('fator', { precision: 10, scale: 4 }).notNull(),
    ativo: boolean('ativo').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('markups_nome_lower_unique_idx').on(sql`lower(${table.nome})`),
  ]
);

export type Markup = typeof markups.$inferSelect;
export type NovoMarkup = typeof markups.$inferInsert;

export const produtos = pgTable(
  'produtos',
  {
    id: serial('id').primaryKey(),
    nome: varchar('nome', { length: 150 }).notNull(),
    descricao: text('descricao'),
    tipoProdutoId: integer('tipo_produto_id')
      .notNull()
      .references(() => tiposProduto.id),
    markupId: integer('markup_id')
      .notNull()
      .references(() => markups.id),
    custoTotal: numeric('custo_total', { precision: 12, scale: 4 }).notNull(),
    precoSugerido: numeric('preco_sugerido', { precision: 12, scale: 4 }).notNull(),
    precoVenda: numeric('preco_venda', { precision: 12, scale: 4 }).notNull(),
    ativo: boolean('ativo').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('produtos_nome_lower_unique_idx').on(sql`lower(${table.nome})`),
  ]
);

export type Produto = typeof produtos.$inferSelect;
export type NovoProduto = typeof produtos.$inferInsert;

export const produtoInsumos = pgTable(
  'produto_insumos',
  {
    id: serial('id').primaryKey(),
    produtoId: integer('produto_id')
      .notNull()
      .references(() => produtos.id, { onDelete: 'cascade' }),
    insumoId: integer('insumo_id')
      .notNull()
      .references(() => insumos.id),
    quantidade: numeric('quantidade', { precision: 12, scale: 4 }).notNull(),
    custoUnitarioBase: numeric('custo_unitario_base', { precision: 12, scale: 6 }).notNull(),
    custoComponente: numeric('custo_componente', { precision: 12, scale: 4 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('produto_insumos_produto_insumo_unique_idx').on(table.produtoId, table.insumoId),
  ]
);

export type ProdutoInsumo = typeof produtoInsumos.$inferSelect;
export type NovoProdutoInsumo = typeof produtoInsumos.$inferInsert;
