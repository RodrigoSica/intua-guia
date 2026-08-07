import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { clientes, energiaAudios, energias } from "../../../../../db/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const [energia] = await db.select().from(energias).where(eq(energias.id, id)).limit(1);
  if (!energia) {
    return Response.json({ error: "Documento não encontrado." }, { status: 404 });
  }

  const audios = await db
    .select()
    .from(energiaAudios)
    .where(eq(energiaAudios.energiaId, id))
    .orderBy(asc(energiaAudios.secaoId), asc(energiaAudios.ordem));

  return Response.json({ energia, audios });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = (await request.json()) as {
      consulenteNome?: string;
      orientacoes?: string;
      secoes?: unknown;
    };

    const patch: Record<string, unknown> = {};

    if (typeof payload.consulenteNome === "string") {
      const nome = payload.consulenteNome.trim();
      if (!nome) {
        return Response.json({ error: "O nome não pode ficar vazio." }, { status: 400 });
      }
      patch.consulenteNome = nome;
    }
    if (typeof payload.orientacoes === "string") {
      patch.orientacoes = payload.orientacoes;
    }
    // As seções chegam como array e são guardadas serializadas. Serializar aqui
    // (e não no cliente) garante que o que está no banco é sempre JSON válido.
    if (Array.isArray(payload.secoes)) {
      patch.secoes = JSON.stringify(payload.secoes);
    }

    if (Object.keys(patch).length === 0) {
      return Response.json({ error: "Nenhum campo para atualizar." }, { status: 400 });
    }

    const db = getDb();
    await db.update(energias).set(patch).where(eq(energias.id, id));

    const [energia] = await db.select().from(energias).where(eq(energias.id, id)).limit(1);
    if (!energia) {
      return Response.json({ error: "Documento não encontrado." }, { status: 404 });
    }

    return Response.json({ energia });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    // A energia nasce de um pré-cadastro. Se ela for apagada, o atendimento
    // correspondente também sai do painel para não deixar um cliente órfão.
    await db.delete(clientes).where(eq(clientes.energiaId, id));
    await db.delete(energiaAudios).where(eq(energiaAudios.energiaId, id));
    await db.delete(energias).where(eq(energias.id, id));

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return Response.json({ error: message }, { status: 500 });
  }
}
