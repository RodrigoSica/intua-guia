import { desc } from "drizzle-orm";
import AdminLeiturasLista from "../../AdminLeiturasLista";
import { getDb } from "../../../db";
import { leituras } from "../../../db/schema";

export const metadata = { title: "Fazer leitura | Intua Guia" };

export default async function AdminLeiturasPage() {
  const db = getDb();
  const rows = await db.select().from(leituras).orderBy(desc(leituras.criadaEm));

  return (
    <main className="admin">
      <div className="container">
        <a href="/admin" className="admin__voltar">← Dashboard</a>
        <p className="eyebrow">Admin</p>
        <h1>Leituras</h1>
        <span className="section-mark" aria-hidden="true">✦</span>

        <AdminLeiturasLista
          iniciais={rows.map((l) => ({
            id: l.id,
            consulenteNome: l.consulenteNome,
            tipoLeitura: l.tipoLeitura,
            status: l.status,
            criadaEm: l.criadaEm,
          }))}
        />
      </div>
    </main>
  );
}
