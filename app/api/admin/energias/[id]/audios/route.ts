import { env } from "cloudflare:workers";
import { count, eq } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import { energiaAudios, energias } from "../../../../../../db/schema";

interface Env {
  MIDIA: R2Bucket;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: energiaId } = await params;
    const db = getDb();
    const [energia] = await db.select({ id: energias.id }).from(energias).where(eq(energias.id, energiaId)).limit(1);
    if (!energia) return Response.json({ error: "Documento não encontrado." }, { status: 404 });

    const form = await request.formData();
    const audio = form.get("audio");
    const secaoId = (form.get("secaoId") as string | null)?.trim() || null;
    const letraIndiceValor = form.get("letraIndice");
    const letraIndice = letraIndiceValor === null || letraIndiceValor === "" ? null : Number(letraIndiceValor);
    if (letraIndice !== null && (!Number.isInteger(letraIndice) || letraIndice < 0)) {
      return Response.json({ error: "A letra informada não é válida." }, { status: 400 });
    }
    if (!(audio instanceof File) || audio.size === 0) {
      return Response.json({ error: "Envie um áudio válido." }, { status: 400 });
    }

    const [{ total }] = await db
      .select({ total: count() })
      .from(energiaAudios)
      .where(eq(energiaAudios.energiaId, energiaId));
    const ordem = total + 1;
    const audioId = crypto.randomUUID();
    const escopo = secaoId ? `bloco-${secaoId}` : "orientacoes";
    const sufixo = letraIndice === null ? `audio-${ordem}` : `letra-${letraIndice + 1}-audio-${ordem}`;
    const r2Key = `e/${energiaId}/${escopo}/${sufixo}`;
    const { MIDIA } = env as unknown as Env;
    await MIDIA.put(r2Key, await audio.arrayBuffer(), {
      httpMetadata: { contentType: audio.type || "audio/webm" },
    });
    await db.insert(energiaAudios).values({ id: audioId, energiaId, secaoId, letraIndice, ordem, r2Key });

    return Response.json({ audio: { id: audioId, energiaId, secaoId, letraIndice, ordem, r2Key } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return Response.json({ error: message }, { status: 500 });
  }
}
