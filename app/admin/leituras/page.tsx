import { desc } from "drizzle-orm";
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

        {rows.length === 0 ? (
          <p className="admin__vazio">Nenhum pedido ainda. Use o botão &ldquo;Solicitar leitura&rdquo; no dashboard.</p>
        ) : (
          <ul className="admin__lista">
            {rows.map((leitura) => (
              <li key={leitura.id}>
                <a href={`/admin/leitura/${leitura.id}`} className="admin__item">
                  <span className={`admin__status admin__status--${leitura.status}`}>
                    {leitura.status === "publicada" ? "Publicada" : "Preparando"}
                  </span>
                  <span className="admin__nome">{leitura.consulenteNome}</span>
                  <span className="admin__tipo">{leitura.tipoLeitura}</span>
                  <span className="admin__data">{new Date(leitura.criadaEm).toLocaleDateString("pt-BR")}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
