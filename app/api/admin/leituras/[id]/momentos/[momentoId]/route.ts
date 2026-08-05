import { env } from "cloudflare:workers";
import { count, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../../../../../db";
import { audios, fotos, momentos } from "../../../../../../../db/schema";

interface Env {
  MIDIA: R2Bucket;
}

// Editar um bloco já criado: título/resumo/pontos-chave, remover fotos/áudios
// específicos (por id) e acrescentar novos — tudo na mesma chamada, para o
// "Salvar alterações" do admin ser uma única requisição.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; momentoId: string }> }
) {
  const { id: leituraId, momentoId } = await params;
  const { MIDIA } = env as unknown as Env;
  const db = getDb();

  const [momento] = await db
    .select({ id: momentos.id })
    .from(momentos)
    .where(eq(momentos.id, momentoId))
    .limit(1);
  if (!momento) {
    return Response.json({ error: "Bloco não encontrado." }, { status: 404 });
  }

  const form = await request.formData();
  const titulo = (form.get("titulo") as string | null)?.trim() || null;
  const resumo = (form.get("resumo") as string | null)?.trim() || null;
  const pontosChave = (form.get("pontosChave") as string | null)?.trim() || null;
  const removerFotos = form.getAll("removerFotos") as string[];
  const removerAudios = form.getAll("removerAudios") as string[];
  const novasFotos = form.getAll("fotos") as File[];
  const novosAudios = form.getAll("audios") as File[];

  await db.update(momentos).set({ titulo, resumo, pontosChave }).where(eq(momentos.id, momentoId));

  if (removerFotos.length > 0) {
    const fotosParaRemover = await db
      .select({ id: fotos.id, r2Key: fotos.r2Key })
      .from(fotos)
      .where(inArray(fotos.id, removerFotos));
    if (fotosParaRemover.length > 0) {
      await MIDIA.delete(fotosParaRemover.map((f) => f.r2Key));
      await db.delete(fotos).where(inArray(fotos.id, removerFotos));
    }
  }

  if (removerAudios.length > 0) {
    const audiosParaRemover = await db
      .select({ id: audios.id, r2Key: audios.r2Key })
      .from(audios)
      .where(inArray(audios.id, removerAudios));
    if (audiosParaRemover.length > 0) {
      await MIDIA.delete(audiosParaRemover.map((a) => a.r2Key));
      await db.delete(audios).where(inArray(audios.id, removerAudios));
    }
  }

  const audiosInseridos = [];
  if (novosAudios.some((a) => a && a.size > 0)) {
    const [{ total }] = await db
      .select({ total: count() })
      .from(audios)
      .where(eq(audios.momentoId, momentoId));
    let audioOrdem = total + 1;
    for (const audio of novosAudios) {
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
  }

  const fotosInseridas = [];
  if (novasFotos.some((f) => f && f.size > 0)) {
    const [{ total }] = await db
      .select({ total: count() })
      .from(fotos)
      .where(eq(fotos.momentoId, momentoId));
    let fotoOrdem = total + 1;
    for (const foto of novasFotos) {
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
  }

  return Response.json({
    momento: { id: momentoId, titulo, resumo, pontosChave, audiosInseridos, fotosInseridas },
  });
}

// Apaga o bloco inteiro: objetos no R2 (fotos e áudios) e as linhas no D1.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; momentoId: string }> }
) {
  const { id: leituraId, momentoId } = await params;
  const { MIDIA } = env as unknown as Env;
  const db = getDb();

  let cursor: string | undefined;
  do {
    const lote = await MIDIA.list({ prefix: `l/${leituraId}/${momentoId}/`, cursor });
    if (lote.objects.length > 0) {
      await MIDIA.delete(lote.objects.map((objeto) => objeto.key));
    }
    cursor = lote.truncated ? lote.cursor : undefined;
  } while (cursor);

  await db.delete(audios).where(eq(audios.momentoId, momentoId));
  await db.delete(fotos).where(eq(fotos.momentoId, momentoId));
  await db.delete(momentos).where(eq(momentos.id, momentoId));

  return Response.json({ ok: true });
}
