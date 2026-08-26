import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { audios, fotos, leituras, momentos } from "../../../db/schema";
import LeituraSala from "../../LeituraSala";

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

  if (leitura.status !== "publicada") {
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

  const momentosRows = await db
    .select()
    .from(momentos)
    .where(eq(momentos.leituraId, leitura.id))
    .orderBy(asc(momentos.ordem));

  const momentosCompletos = await Promise.all(
    momentosRows.map(async (momento) => {
      const fotosRows = await db
        .select()
        .from(fotos)
        .where(eq(fotos.momentoId, momento.id))
        .orderBy(asc(fotos.ordem));
      const audiosRows = await db
        .select()
        .from(audios)
        .where(eq(audios.momentoId, momento.id))
        .orderBy(asc(audios.ordem));
      return { ...momento, fotos: fotosRows, audios: audiosRows };
    })
  );

  return (
    <main className="leitura-sala leitura-sala--pronta">
      <div className="container leitura-sala__conteudo">
        <p className="eyebrow">{leitura.tipoLeitura}</p>
        <h1>Olá, {leitura.consulenteNome.split(" ")[0]}</h1>
        <span className="section-mark" aria-hidden="true">✦</span>

        <LeituraSala consulenteNome={leitura.consulenteNome} tipoLeitura={leitura.tipoLeitura} momentos={momentosCompletos} />
      </div>
    </main>
  );
}
