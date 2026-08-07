import { env } from "cloudflare:workers";
import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { audios, clientes, fotos, leituras, momentos } from "../../../../../db/schema";

interface Env {
  MIDIA: R2Bucket;
}

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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const { MIDIA } = env as unknown as Env;

    // Momentos, fotos e áudios saem do D1 por cascata, mas os arquivos no R2
    // não têm quem os apague — ficariam ocupando espaço para sempre. Todos os
    // objetos de uma leitura moram sob o mesmo prefixo (ver a rota de
    // momentos), então dá para varrer e remover de uma vez.
    let cursor: string | undefined;
    do {
      const lote = await MIDIA.list({ prefix: `l/${id}/`, cursor });
      if (lote.objects.length > 0) {
        await MIDIA.delete(lote.objects.map((objeto) => objeto.key));
      }
      cursor = lote.truncated ? lote.cursor : undefined;
    } while (cursor);

    // As linhas filhas são apagadas na mão em vez de confiar no ON DELETE
    // CASCADE: a cascata só age se a conexão estiver com PRAGMA foreign_keys
    // ligado, e se não estiver o banco fica com momentos órfãos sem avisar.
    const momentosDaLeitura = await db
      .select({ id: momentos.id })
      .from(momentos)
      .where(eq(momentos.leituraId, id));

    for (const momento of momentosDaLeitura) {
      await db.delete(audios).where(eq(audios.momentoId, momento.id));
      await db.delete(fotos).where(eq(fotos.momentoId, momento.id));
    }
    await db.delete(momentos).where(eq(momentos.leituraId, id));

    // A leitura nasce de um pré-cadastro. Se ela for apagada, o atendimento
    // correspondente também sai do painel para não deixar um cliente órfão.
    await db.delete(clientes).where(eq(clientes.leituraId, id));

    await db.delete(leituras).where(eq(leituras.id, id));

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return Response.json({ error: message }, { status: 500 });
  }
}
