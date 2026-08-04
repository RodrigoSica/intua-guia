import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { leituras } from "../../../../db/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const db = getDb();
  const [leitura] = await db.select().from(leituras).where(eq(leituras.token, token)).limit(1);

  if (!leitura) {
    return Response.json({ error: "Leitura não encontrada." }, { status: 404 });
  }

  return Response.json({ leitura });
}
