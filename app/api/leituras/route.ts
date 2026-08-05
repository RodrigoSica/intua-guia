import { getDb } from "../../../db";
import { clientes, leituras } from "../../../db/schema";

const TIPOS_LEITURA = [
  "Se Desvendando",
  "Círculo de Afetos",
  "Caminhos e Desafios",
  "Equilíbrio Energético",
  "Duas Perguntas",
  "Mandala Astrológica",
  "Tiragem Cigana",
];

function gerarToken() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 14);
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      consulenteNome?: string;
      consulenteNascimento?: string;
      tipoLeitura?: string;
      perguntas?: string;
      // Campos de negócio — só o admin envia. O formulário público (a
      // consulente preenchendo sobre si mesma) não tem por que perguntar
      // "quem indicou você" ou "quanto você pagou", então ficam opcionais e,
      // se ausentes, o cliente nasce igual a antes: só nome, nascimento e tipo.
      telefone?: string;
      instagram?: string;
      veioPorOnde?: string;
      quemIndicou?: string;
      dataAgendada?: string;
      valorConsulta?: string;
      status?: string;
    };

    const consulenteNome = payload.consulenteNome?.trim() ?? "";
    const tipoLeitura = payload.tipoLeitura?.trim() ?? "";
    const consulenteNascimento = payload.consulenteNascimento?.trim() || null;
    const perguntas = payload.perguntas?.trim() || null;
    const limpar = (v?: string) => v?.trim() || null;

    if (!consulenteNome) {
      return Response.json({ error: "Informe o nome da pessoa a ser consultada." }, { status: 400 });
    }
    if (!TIPOS_LEITURA.includes(tipoLeitura)) {
      return Response.json({ error: "Selecione um tipo de leitura válido." }, { status: 400 });
    }

    const db = getDb();
    const token = gerarToken();
    const leituraId = crypto.randomUUID();

    await db.insert(leituras).values({
      id: leituraId,
      token,
      consulenteNome,
      consulenteNascimento,
      tipoLeitura,
      perguntas,
      status: "preparando",
    });

    // Todo pedido de leitura já entra como cliente no dashboard. Os campos de
    // negócio vêm preenchidos quando é a Vanessa quem cria (via /admin/solicitar)
    // e ficam em branco quando é a própria consulente preenchendo — ela completa
    // depois direto no dashboard.
    await db.insert(clientes).values({
      id: crypto.randomUUID(),
      leituraId,
      nome: consulenteNome,
      dataNascimento: consulenteNascimento,
      atendimento: tipoLeitura,
      telefone: limpar(payload.telefone),
      instagram: limpar(payload.instagram),
      veioPorOnde: limpar(payload.veioPorOnde),
      quemIndicou: limpar(payload.quemIndicou),
      dataAgendada: limpar(payload.dataAgendada),
      valorConsulta: payload.valorConsulta ? Number(payload.valorConsulta) : null,
      status: payload.status === "pago" ? "pago" : "pendente",
    });

    return Response.json({ token }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return Response.json({ error: message }, { status: 500 });
  }
}
