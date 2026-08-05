import { env } from "cloudflare:workers";
import { count, eq } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import { audios, fotos, momentos } from "../../../../../../db/schema";

interface Env {
  MIDIA: R2Bucket;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leituraId } = await params;
  const { MIDIA } = env as unknown as Env;

  const form = await request.formData();
  const titulo = (form.get("titulo") as string | null)?.trim() || null;
  const resumo = (form.get("resumo") as string | null)?.trim() || null;
  const pontosChave = (form.get("pontosChave") as string | null)?.trim() || null;
  const audiosFiles = form.getAll("audios") as File[];
  const fotosFiles = form.getAll("fotos") as File[];

  const db = getDb();
  const [{ total }] = await db
    .select({ total: count() })
    .from(momentos)
    .where(eq(momentos.leituraId, leituraId));
  const ordem = total + 1;

  const momentoId = crypto.randomUUID();
  await db.insert(momentos).values({ id: momentoId, leituraId, ordem, titulo, resumo, pontosChave });

  const audiosInseridos = [];
  let audioOrdem = 1;
  for (const audio of audiosFiles) {
    if (!audio || audio.size === 0) continue;
    const r2Key = `l/${leituraId}/${momentoId}/audio-${audioOrdem}`;
    await MIDIA.put(r2Key, await audio.arrayBuffer(), {
      httpMetadata: { contentType: audio.type || "audio/webm" },
    });
    const audioId = crypto.randomUUID();
    await db.insert(audios).values({ id: audioId, momentoId, ordem: audioOrdem, r2Key });
    audiosInseridos.push({ id: audioId, ordem: audioOrdem, r2Key });
    audioOrdem += 1;
  }

  const fotosInseridas = [];
  let fotoOrdem = 1;
  for (const foto of fotosFiles) {
    if (!foto || foto.size === 0) continue;
    const r2Key = `l/${leituraId}/${momentoId}/foto-${fotoOrdem}`;
    await MIDIA.put(r2Key, await foto.arrayBuffer(), {
      httpMetadata: { contentType: foto.type || "image/jpeg" },
    });
    const fotoId = crypto.randomUUID();
    await db.insert(fotos).values({ id: fotoId, momentoId, ordem: fotoOrdem, r2Key });
    fotosInseridas.push({ id: fotoId, ordem: fotoOrdem, r2Key });
    fotoOrdem += 1;
  }

  return Response.json(
    { momento: { id: momentoId, leituraId, ordem, titulo, resumo, pontosChave, audios: audiosInseridos, fotos: fotosInseridas } },
    { status: 201 }
  );
}
