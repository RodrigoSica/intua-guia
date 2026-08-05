import { desc } from "drizzle-orm";
import { getDb } from "../../../../db";
import { clientes, energias } from "../../../../db/schema";

// Rótulo do atendimento no dashboard. Fixo aqui para que toda energia criada
// apareça sob o mesmo nome e a Vanessa consiga filtrar por ele.
export const ATENDIMENTO_ENERGIA = "Energia Vibracional do Nome";

// Texto de abertura do modelo em PDF. Vem preenchido para a Vanessa não ter
// que redigitar a cada cliente — é o mesmo em toda leitura —, mas fica num
// campo editável porque é dela a palavra final.
export const ORIENTACOES_PADRAO = [
  "A leitura é baseada na Cabala, no Alfabeto Hebraico, no Tarot por meio dos Arcanos Maiores e na Astrologia, considerando os planetas e signos. Vale lembrar que os signos mencionados não se referem ao signo pessoal de cada pessoa",
  "As letras que se repetem mais de uma vez no nome tem a energia relacionada à ela potencializada",
  "As energias mencionadas na leitura estão relacionadas ao seu nome atual.",
  "O intuito é trabalhar o alinhamento de cada uma delas, já que transitamos em sua polaridade e o desalinhamento acaba impactando nas nossas vivências",
].join("\n\n");

function gerarToken() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 14);
}

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(energias).orderBy(desc(energias.criadaEm));
  return Response.json({ energias: rows });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      consulenteNome?: string;
      telefone?: string;
      instagram?: string;
      dataNascimento?: string;
      veioPorOnde?: string;
      quemIndicou?: string;
      valorConsulta?: string;
      status?: string;
      dataAgendada?: string;
    };
    const consulenteNome = payload.consulenteNome?.trim() ?? "";

    if (!consulenteNome) {
      return Response.json({ error: "Informe o nome da pessoa." }, { status: 400 });
    }

    const limpar = (v?: string) => v?.trim() || null;

    const db = getDb();
    const id = crypto.randomUUID();

    // Já nasce com uma seção por parte do nome ("Rafaela Costa Rosa" vira três
    // blocos), que é exatamente como o documento é organizado. Poupa a Vanessa
    // de criar e nomear cada bloco à mão no caso mais comum.
    const secoes = consulenteNome
      .split(/\s+/)
      .filter((parte) => parte.length > 1)
      .map((parte) => ({
        id: crypto.randomUUID(),
        titulo: parte.toLocaleUpperCase("pt-BR"),
        letras: [...parte.toLocaleUpperCase("pt-BR")].map((letra) => ({ letra, numero: "" })),
        tabelas: [
          {
            linhas: [
              { rotulo: "Vogais:", valor: "Desenvolvimento espiritual" },
              { rotulo: "Consoantes:", valor: "Realização e trabalho no plano físico" },
            ],
          },
        ],
        texto: "",
      }));

    await db.insert(energias).values({
      id,
      token: gerarToken(),
      consulenteNome,
      orientacoes: ORIENTACOES_PADRAO,
      secoes: JSON.stringify(secoes),
      status: "preparando",
    });

    // O documento entra no dashboard como um atendimento, igual às leituras —
    // sem isso, a energia vibracional ficaria fora do controle de quem pagou
    // e de quanto entrou no mês.
    await db.insert(clientes).values({
      id: crypto.randomUUID(),
      energiaId: id,
      nome: consulenteNome,
      atendimento: ATENDIMENTO_ENERGIA,
      telefone: limpar(payload.telefone),
      instagram: limpar(payload.instagram),
      dataNascimento: limpar(payload.dataNascimento),
      veioPorOnde: limpar(payload.veioPorOnde),
      quemIndicou: limpar(payload.quemIndicou),
      dataAgendada: limpar(payload.dataAgendada),
      valorConsulta: payload.valorConsulta ? Number(payload.valorConsulta) : null,
      status: payload.status === "pago" ? "pago" : "pendente",
    });

    return Response.json({ id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return Response.json({ error: message }, { status: 500 });
  }
}
