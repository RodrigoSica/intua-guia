import { eq } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import { energias } from "../../../../../../db/schema";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  await db
    .update(energias)
    .set({ status: "publicada", publicadaEm: new Date().toISOString() })
    .where(eq(energias.id, id));

  const [energia] = await db.select().from(energias).where(eq(energias.id, id)).limit(1);
  return Response.json({ energia });
}
