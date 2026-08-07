import { env } from "cloudflare:workers";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../../../db";
import { energiaAudios } from "../../../../../../../db/schema";

interface Env {
  MIDIA: R2Bucket;
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; audioId: string }> }
) {
  try {
    const { id: energiaId, audioId } = await params;
    const db = getDb();
    const [audio] = await db
      .select()
      .from(energiaAudios)
      .where(and(eq(energiaAudios.id, audioId), eq(energiaAudios.energiaId, energiaId)))
      .limit(1);
    if (!audio) return Response.json({ error: "Áudio não encontrado." }, { status: 404 });

    const { MIDIA } = env as unknown as Env;
    await MIDIA.delete(audio.r2Key);
    await db.delete(energiaAudios).where(eq(energiaAudios.id, audioId));
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return Response.json({ error: message }, { status: 500 });
  }
}
