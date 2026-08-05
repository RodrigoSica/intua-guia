import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

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

// "momentos" no banco = "blocos" na interface (nome que a Vanessa usa: cada
// bloco é um momento da leitura, com quantas fotos e áudios ela quiser).
export const momentos = sqliteTable("momentos", {
  id: text("id").primaryKey(),
  leituraId: text("leitura_id")
    .notNull()
    .references(() => leituras.id, { onDelete: "cascade" }),
  ordem: integer("ordem").notNull(),
  titulo: text("titulo"),
  resumo: text("resumo"), // pontos-chave do bloco, escritos pela Vanessa
});

export const fotos = sqliteTable("fotos", {
  id: text("id").primaryKey(),
  momentoId: text("momento_id")
    .notNull()
    .references(() => momentos.id, { onDelete: "cascade" }),
  ordem: integer("ordem").notNull(),
  r2Key: text("r2_key").notNull(),
});

export const audios = sqliteTable("audios", {
  id: text("id").primaryKey(),
  momentoId: text("momento_id")
    .notNull()
    .references(() => momentos.id, { onDelete: "cascade" }),
  ordem: integer("ordem").notNull(),
  r2Key: text("r2_key").notNull(),
  duracao: integer("duracao"), // segundos
});

// Energia Vibracional do Nome — o outro entregável da Vanessa, hoje montado à
// mão num PDF (admin/modelo Energia Vibracional Nome.pdf). Diferente da
// leitura, aqui não há mídia: é um documento de texto e tabelas.
//
// As seções ficam num único campo JSON em vez de tabela própria. A forma delas
// é variável (cada nome tem um número diferente de letras, e ela acrescenta
// quantas tabelas quiser), o documento é sempre editado inteiro e por uma
// pessoa só — normalizar isso em duas tabelas custaria junções e migrações a
// cada ajuste de layout, sem ganhar nada em consulta.
export const energias = sqliteTable("energias", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(), // slug secreto da URL pública
  consulenteNome: text("consulente_nome").notNull(),
  orientacoes: text("orientacoes"), // texto de abertura, editável
  secoes: text("secoes"), // JSON: Secao[] — ver app/AdminEnergiaBuilder.tsx
  status: text("status").notNull().default("preparando"), // preparando | publicada
  criadaEm: text("criada_em").notNull().default(sql`CURRENT_TIMESTAMP`),
  publicadaEm: text("publicada_em"),
});

// Fase 3 do plano (docs/plano-sala-de-leitura.md): visão de negócio dos
// atendimentos, migrada da planilha "Consulentes 2026.xlsx". Uma linha por
// atendimento (não por pessoa) — é o que a aba "Leituras" da planilha já
// rastreava. "Mês" não vira coluna própria: é derivado de dataAgendada na UI.
export const clientes = sqliteTable("clientes", {
  id: text("id").primaryKey(),
  leituraId: text("leitura_id").references(() => leituras.id, { onDelete: "set null" }),
  nome: text("nome").notNull(),
  veioPorOnde: text("veio_por_onde"), // WhatsApp | Recorrente | Indicação | Presencial...
  atendimento: text("atendimento"), // tipo de leitura/atendimento
  valorConsulta: real("valor_consulta"),
  status: text("status").notNull().default("pendente"), // pago | pendente
  dataNascimento: text("data_nascimento"), // ISO date
  telefone: text("telefone"),
  dataAgendada: text("data_agendada"), // ISO date
  quemIndicou: text("quem_indicou"), // substitui a coluna "Observações" da planilha
  instagram: text("instagram"), // vinha da aba "Base Consulentes" da planilha
  notas: text("notas"), // anotações livres — o que "Observações" era antes de virar quemIndicou
  criadoEm: text("criado_em").notNull().default(sql`CURRENT_TIMESTAMP`),
});
