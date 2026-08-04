import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Sala de Leitura — v1. Ver docs/plano-sala-de-leitura.md para o desenho
// completo. Escopo enxuto de propósito: sem tabela de consulente/histórico
// ainda (fase 3) e sem campos de transcrição/resumo (fase 2).

export const leituras = sqliteTable("leituras", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(), // slug secreto da URL pública
  consulenteNome: text("consulente_nome").notNull(),
  consulenteNascimento: text("consulente_nascimento"), // ISO date
  tipoLeitura: text("tipo_leitura").notNull(),
  perguntas: text("perguntas"), // o que a pessoa quer perguntar, texto livre
  status: text("status").notNull().default("preparando"), // preparando | publicada
  prazo: text("prazo"), // ISO date, previsão de entrega
  criadaEm: text("criada_em").notNull().default(sql`CURRENT_TIMESTAMP`),
  publicadaEm: text("publicada_em"),
});

export const momentos = sqliteTable("momentos", {
  id: text("id").primaryKey(),
  leituraId: text("leitura_id")
    .notNull()
    .references(() => leituras.id, { onDelete: "cascade" }),
  ordem: integer("ordem").notNull(),
  titulo: text("titulo"),
  audioKey: text("audio_key"), // chave no R2
  audioDuracao: integer("audio_duracao"), // segundos
});

export const fotos = sqliteTable("fotos", {
  id: text("id").primaryKey(),
  momentoId: text("momento_id")
    .notNull()
    .references(() => momentos.id, { onDelete: "cascade" }),
  ordem: integer("ordem").notNull(),
  r2Key: text("r2_key").notNull(),
});
