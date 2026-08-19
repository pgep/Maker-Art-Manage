import { pgTable, serial, text, doublePrecision, timestamp } from 'drizzle-orm/pg-core';

export const unidadesMedida = pgTable('unidades_medida', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull(),
  tipo: text('tipo').notNull(),
  fatorConversao: doublePrecision('fator_conversao').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UnidadeMedida = typeof unidadesMedida.$inferSelect;
export type NovaUnidadeMedida = typeof unidadesMedida.$inferInsert;
