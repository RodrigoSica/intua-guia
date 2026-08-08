import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import {
  audios,
  clientes,
  energiaAudios,
  energias,
  fotos,
  leituras,
  momentos,
} from "../../../../../db/schema";

interface Env {
  MIDIA: R2Bucket;
}

const CAMPOS_EDITAVEIS = [
  "nome",
  "veioPorOnde",
  "atendimento",
  "valorConsulta",
  "status",
  "dataNascimento",
  "telefone",
  "dataAgendada",
  "quemIndicou",
  "instagram",
  "notas",
] as const;

type Campo = (typeof CAMPOS_EDITAVEIS)[number];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = (await request.json()) as Partial<Record<Campo, unknown>>;

    const patch: Record<string, unknown> = {};
    for (const campo of CAMPOS_EDITAVEIS) {
      if (!(campo in payload)) continue;
      const valor = payload[campo];
      const vazio = typeof valor === "string" && valor.trim() === "";
      if (campo === "valorConsulta") {
        patch[campo] = vazio ? null : Number(valor);
      } else {
        patch[campo] = vazio ? null : valor;
      }
    }

    if (Object.keys(patch).length === 0) {
      return Response.json({ error: "Nenhum campo para atualizar." }, { status: 400 });
    }
    if ("nome" in patch && !patch.nome) {
      return Response.json({ error: "O nome não pode ficar vazio." }, { status: 400 });
    }

    const db = getDb();
    await db.update(clientes).set(patch).where(eq(clientes.id, id));

    const [row] = await db.select().from(clientes).where(eq(clientes.id, id)).limit(1);
    if (!row) {
      return Response.json({ error: "Cliente não encontrado." }, { status: 404 });
    }

    return Response.json({ cliente: row });
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
    const [cliente] = await db.select().from(clientes).where(eq(clientes.id, id)).limit(1);

    if (!cliente) {
      return Response.json({ error: "Cliente não encontrado." }, { status: 404 });
    }

    // Remover o cliente apaga tudo relacionado a ele — leitura/energia,
    // mídia no R2, o que for. Uma vez deletado, some por completo, sem
    // deixar registro órfão pra trás.
    const { MIDIA } = env as unknown as Env;

    if (cliente.leituraId) {
      const [leitura] = await db
        .select({ id: leituras.id })
        .from(leituras)
        .where(eq(leituras.id, cliente.leituraId))
        .limit(1);

      if (leitura) {
        let cursor: string | undefined;
        do {
          const lote = await MIDIA.list({ prefix: `l/${leitura.id}/`, cursor });
          if (lote.objects.length > 0) {
            await MIDIA.delete(lote.objects.map((objeto) => objeto.key));
          }
          cursor = lote.truncated ? lote.cursor : undefined;
        } while (cursor);

        const momentosDaLeitura = await db
          .select({ id: momentos.id })
          .from(momentos)
          .where(eq(momentos.leituraId, leitura.id));
        for (const momento of momentosDaLeitura) {
          await db.delete(audios).where(eq(audios.momentoId, momento.id));
          await db.delete(fotos).where(eq(fotos.momentoId, momento.id));
        }
        await db.delete(momentos).where(eq(momentos.leituraId, leitura.id));
        await db.delete(leituras).where(eq(leituras.id, leitura.id));
      }
    }

    if (cliente.energiaId) {
      const [energia] = await db
        .select({ id: energias.id })
        .from(energias)
        .where(eq(energias.id, cliente.energiaId))
        .limit(1);

      if (energia) {
        let cursor: string | undefined;
        do {
          const lote = await MIDIA.list({ prefix: `e/${energia.id}/`, cursor });
          if (lote.objects.length > 0) {
            await MIDIA.delete(lote.objects.map((objeto) => objeto.key));
          }
          cursor = lote.truncated ? lote.cursor : undefined;
        } while (cursor);

        await db.delete(energiaAudios).where(eq(energiaAudios.energiaId, energia.id));
        await db.delete(energias).where(eq(energias.id, energia.id));
      }
    }

    await db.delete(clientes).where(eq(clientes.id, id));
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return Response.json({ error: message }, { status: 500 });
  }
}
