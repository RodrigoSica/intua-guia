import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { leituras } from "../../../db/schema";

export default async function LeituraPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const db = getDb();
  const [leitura] = await db.select().from(leituras).where(eq(leituras.token, token)).limit(1);

  if (!leitura) {
    return (
      <main className="leitura-sala leitura-sala--estado">
        <div className="container">
          <span className="section-mark" aria-hidden="true">✦</span>
          <h1>Leitura não encontrada</h1>
          <p>Confira se o link foi copiado corretamente.</p>
        </div>
      </main>
    );
  }

  if (leitura.status === "preparando") {
    return (
      <main className="leitura-sala leitura-sala--estado">
        <div className="container">
          <p className="eyebrow">{leitura.tipoLeitura}</p>
          <h1>Olá, {leitura.consulenteNome.split(" ")[0]}</h1>
          <span className="section-mark" aria-hidden="true">✦</span>
          <p>Sua leitura está sendo preparada com carinho. Assim que estiver pronta, esta mesma página vai mostrar tudo — é só voltar aqui quando a Vanessa avisar.</p>
        </div>
      </main>
    );
  }

  // status "publicada" — conteúdo completo (momentos, áudios, fotos) chega
  // no Cenário 2. Placeholder por enquanto para o link nunca quebrar.
  return (
    <main className="leitura-sala leitura-sala--estado">
      <div className="container">
        <p className="eyebrow">{leitura.tipoLeitura}</p>
        <h1>Olá, {leitura.consulenteNome.split(" ")[0]}</h1>
        <span className="section-mark" aria-hidden="true">✦</span>
        <p>Sua leitura está pronta! Estamos finalizando a exibição completa dela nesta página.</p>
      </div>
    </main>
  );
}
