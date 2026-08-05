import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { clientes } from "../../../../db/schema";

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(clientes).orderBy(desc(clientes.criadoEm));
  return Response.json({ clientes: rows });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { nome?: string };
    const nome = payload.nome?.trim() ?? "";
    if (!nome) {
      return Response.json({ error: "Informe o nome do cliente." }, { status: 400 });
    }

    const db = getDb();
    const id = crypto.randomUUID();
    await db.insert(clientes).values({ id, nome });

    const [row] = await db.select().from(clientes).where(eq(clientes.id, id)).limit(1);
    return Response.json({ cliente: row }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return Response.json({ error: message }, { status: 500 });
  }
}
