import { eq } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import { leituras } from "../../../../../../db/schema";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  await db
    .update(leituras)
    .set({ status: "publicada", publicadaEm: new Date().toISOString() })
    .where(eq(leituras.id, id));

  const [leitura] = await db.select().from(leituras).where(eq(leituras.id, id)).limit(1);
  return Response.json({ leitura });
}
