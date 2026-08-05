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
    };

    const consulenteNome = payload.consulenteNome?.trim() ?? "";
    const tipoLeitura = payload.tipoLeitura?.trim() ?? "";
    const consulenteNascimento = payload.consulenteNascimento?.trim() || null;
    const perguntas = payload.perguntas?.trim() || null;

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

    // Todo pedido de leitura já entra como cliente no dashboard — os campos
    // de negócio (telefone, valor, canal, indicação) o formulário não coleta;
    // a Vanessa completa depois direto no dashboard.
    await db.insert(clientes).values({
      id: crypto.randomUUID(),
      leituraId,
      nome: consulenteNome,
      dataNascimento: consulenteNascimento,
      atendimento: tipoLeitura,
    });

    return Response.json({ token }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return Response.json({ error: message }, { status: 500 });
  }
}
