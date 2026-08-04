import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { audios, fotos, leituras, momentos } from "../../../../../db/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const [leitura] = await db.select().from(leituras).where(eq(leituras.id, id)).limit(1);
  if (!leitura) {
    return Response.json({ error: "Leitura não encontrada." }, { status: 404 });
  }

  const momentosRows = await db
    .select()
    .from(momentos)
    .where(eq(momentos.leituraId, id))
    .orderBy(asc(momentos.ordem));

  const momentosCompletos = await Promise.all(
    momentosRows.map(async (momento) => {
      const fotosRows = await db
        .select()
        .from(fotos)
        .where(eq(fotos.momentoId, momento.id))
        .orderBy(asc(fotos.ordem));
      const audiosRows = await db
        .select()
        .from(audios)
        .where(eq(audios.momentoId, momento.id))
        .orderBy(asc(audios.ordem));
      return { ...momento, fotos: fotosRows, audios: audiosRows };
    })
  );

  return Response.json({ leitura, momentos: momentosCompletos });
}
