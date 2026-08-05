import { env } from "cloudflare:workers";
import { criarProvedorWorkersAi, gerarConteudoDaLeitura } from "../../../../../../../lib/ai/leituraConteudo";

interface Env {
  AI: Ai;
}

// Gera título/resumo/pontos-chave a partir do(s) áudio(s) já gravados no
// bloco, ANTES dele ser salvo (o momento em si só é criado ao "Adicionar
// bloco" — ver ../route.ts). Não persiste nada; a Vanessa revisa e edita
// antes de enviar.
export async function POST(request: Request) {
  const { AI } = env as unknown as Env;

  const form = await request.formData();
  const audiosFiles = form.getAll("audios") as File[];

  const audios = [];
  for (const audio of audiosFiles) {
    if (!audio || audio.size === 0) continue;
    audios.push({ bytes: new Uint8Array(await audio.arrayBuffer()) });
  }

  if (audios.length === 0) {
    return Response.json({ error: "Nenhum áudio enviado." }, { status: 400 });
  }

  try {
    const conteudo = await gerarConteudoDaLeitura(criarProvedorWorkersAi(AI), audios);
    return Response.json({ conteudo });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado ao gerar conteúdo.";
    return Response.json({ error: message }, { status: 500 });
  }
}
