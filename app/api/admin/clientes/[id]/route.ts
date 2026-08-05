import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { clientes } from "../../../../../db/schema";

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

    // Só remove a linha do dashboard. A leitura em si (áudios, fotos, o link
    // que a consulente já recebeu) fica intacta — apagar isso junto seria
    // destruir a entrega por causa de uma limpeza de cadastro.
    await db.delete(clientes).where(eq(clientes.id, id));

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return Response.json({ error: message }, { status: 500 });
  }
}
