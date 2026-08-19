import { pgTable, serial, varchar, doublePrecision, timestamp, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
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



