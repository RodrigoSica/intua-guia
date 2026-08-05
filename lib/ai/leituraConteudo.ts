// Geração automática de título/resumo/pontos-chave a partir do áudio de um
// momento da leitura (fase 2 do plano — ver docs/plano-sala-de-leitura.md).
//
// A transcrição existe só durante esta chamada: é lida da memória, usada para
// gerar o conteúdo estruturado abaixo, e descartada — nunca é retornada,
// logada ou persistida. Só título/resumo/pontos-chave chegam ao banco.
//
// Desacoplado do provedor por trás de `ConteudoProvider`: para trocar de
// modelo/fornecedor no futuro basta implementar essa interface e passá-la em
// `gerarConteudoDaLeitura`, sem tocar nas rotas ou na UI que a chamam.

export type ConteudoGerado = {
  titulo: string;
  resumo: string;
  pontosChave: string;
};

export type AudioEntrada = {
  bytes: Uint8Array;
};

export interface ConteudoProvider {
  transcrever(audio: AudioEntrada): Promise<string>;
  gerarConteudoEstruturado(transcricao: string): Promise<ConteudoGerado>;
}

const MODELO_TRANSCRICAO = "@cf/openai/whisper-large-v3-turbo";
// Modelo de texto mais leve do catálogo Workers AI — atende bem a uma tarefa
// de extração/reescrita curta e consome menos do tier gratuito que os modelos
// maiores (ver "Priorizar recursos gratuitos" no pedido original).
// "@cf/meta/llama-3.1-8b-instruct" (sem "-fast") foi descontinuado pela
// Cloudflare em 2026-05-30 — usar sempre a variante ativa do catálogo.
const MODELO_TEXTO = "@cf/meta/llama-3.1-8b-instruct-fast";

const PROMPT_SISTEMA = `Você organiza o relato de uma taróloga sobre um momento de uma leitura de tarot, em português do Brasil. Use SOMENTE o que está na transcrição — nunca invente cartas, nomes, eventos ou interpretações que não foram ditos.
- titulo: até 8 palavras, o assunto do momento.
- resumo: 2 a 3 frases curtas, em tom de convite. Não conte tudo — é uma isca para a consulente ouvir o áudio, não um substituto dele.
- pontosChave: 3 a 5 itens curtos.
Responda apenas com o JSON {"titulo", "resumo", "pontosChave"}, sem texto antes ou depois.`;

// JSON mode do Workers AI: em vez de pedir JSON em prosa e garimpar chaves no
// texto, o formato é declarado aqui e o modelo é obrigado a segui-lo.
const ESQUEMA_CONTEUDO = {
  type: "object",
  properties: {
    titulo: { type: "string" },
    resumo: { type: "string" },
    pontosChave: { type: "array", items: { type: "string" } },
  },
  required: ["titulo", "resumo", "pontosChave"],
};

function extrairJson(texto: string): Record<string, unknown> {
  const inicio = texto.indexOf("{");
  const fim = texto.lastIndexOf("}");
  if (inicio === -1 || fim === -1) {
    throw new Error("A IA não devolveu um JSON reconhecível.");
  }
  return JSON.parse(texto.slice(inicio, fim + 1));
}

// Com response_format o campo `response` costuma vir já parseado (objeto), mas
// o schema publicado do modelo declara string — e na prática varia conforme o
// modelo e a versão. Aceitar as duas formas evita quebrar a cada troca de
// modelo; se vier em terceira forma, o erro diz qual, em vez de "not a function".
function normalizarResposta(bruto: unknown): Record<string, unknown> {
  if (typeof bruto === "string") return extrairJson(bruto);
  if (bruto && typeof bruto === "object" && !Array.isArray(bruto)) {
    return bruto as Record<string, unknown>;
  }
  // Só o formato entra na mensagem — nunca o conteúdo, que vem da transcrição.
  throw new Error(`A IA respondeu num formato inesperado (${bruto === null ? "null" : typeof bruto}).`);
}

function paraLinhas(valor: unknown): string {
  if (Array.isArray(valor)) {
    return valor.map((item) => `- ${String(item).replace(/^-\s*/, "").trim()}`).join("\n");
  }
  return String(valor ?? "").trim();
}

// whisper-large-v3-turbo espera o áudio em base64 (diferente do @cf/openai/whisper
// clássico, que aceita array de bytes) — btoa em chunks evita estourar a call
// stack do spread operator em arquivos de alguns MB.
function paraBase64(bytes: Uint8Array): string {
  let binario = "";
  const tamanhoChunk = 0x8000;
  for (let i = 0; i < bytes.length; i += tamanhoChunk) {
    binario += String.fromCharCode(...bytes.subarray(i, i + tamanhoChunk));
  }
  return btoa(binario);
}

/** Implementação com Cloudflare Workers AI (Whisper + Llama). */
export function criarProvedorWorkersAi(ai: Ai): ConteudoProvider {
  return {
    async transcrever(audio) {
      const resultado = (await ai.run(MODELO_TRANSCRICAO, {
        audio: paraBase64(audio.bytes),
      })) as { text?: string };
      return resultado.text?.trim() ?? "";
    },

    async gerarConteudoEstruturado(transcricao) {
      const resultado = (await ai.run(MODELO_TEXTO, {
        messages: [
          { role: "system", content: PROMPT_SISTEMA },
          { role: "user", content: `Transcrição:\n"""\n${transcricao}\n"""` },
        ],
        response_format: { type: "json_schema", json_schema: ESQUEMA_CONTEUDO },
      })) as { response?: unknown };

      const json = normalizarResposta(resultado.response);
      return {
        titulo: String(json.titulo ?? "").trim(),
        resumo: String(json.resumo ?? "").trim(),
        pontosChave: paraLinhas(json.pontosChave),
      };
    },
  };
}

/**
 * Transcreve os áudios de um momento e gera título/resumo/pontos-chave.
 * Vários áudios do mesmo bloco viram uma única transcrição concatenada antes
 * de ir para o modelo de texto, para o conteúdo cobrir o bloco inteiro.
 */
export async function gerarConteudoDaLeitura(
  provedor: ConteudoProvider,
  audios: AudioEntrada[]
): Promise<ConteudoGerado> {
  if (audios.length === 0) {
    throw new Error("Nenhum áudio para transcrever.");
  }

  const transcricoes: string[] = [];
  for (const audio of audios) {
    const texto = await provedor.transcrever(audio);
    if (texto) transcricoes.push(texto);
  }

  const transcricaoCompleta = transcricoes.join("\n\n");
  if (!transcricaoCompleta) {
    throw new Error("Não foi possível transcrever o áudio.");
  }

  // transcricaoCompleta some daqui pra frente — só o retorno abaixo persiste.
  return provedor.gerarConteudoEstruturado(transcricaoCompleta);
}
