import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { energias } from "../../../db/schema";
import type { Secao } from "../../AdminEnergiaBuilder";

export const metadata = { title: "Energia vibracional do nome | Intua Guia" };

function paragrafos(texto: string | null) {
  if (!texto) return [];
  return texto.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

export default async function EnergiaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const db = getDb();

  const [energia] = await db.select().from(energias).where(eq(energias.token, token)).limit(1);

  if (!energia) {
    return (
      <main className="energia">
        <div className="container energia__vazio">
          <p className="eyebrow">Intua Guia</p>
          <h1>Documento não encontrado</h1>
          <p>Confira o link que você recebeu.</p>
        </div>
      </main>
    );
  }

  if (energia.status !== "publicada") {
    return (
      <main className="energia">
        <div className="container energia__vazio">
          <p className="eyebrow">Intua Guia</p>
          <h1>Sua leitura está sendo preparada</h1>
          <p>Assim que a Vanessa terminar, é por este mesmo link que ela chega até você.</p>
        </div>
      </main>
    );
  }

  let secoes: Secao[] = [];
  try {
    secoes = JSON.parse(energia.secoes ?? "[]");
  } catch {
    secoes = [];
  }

  return (
    <main className="energia">
      <header className="energia__capa">
        <div className="container">
          <h1>Energia vibracional<br />do nome</h1>
          <p className="energia__nome">{energia.consulenteNome}</p>
        </div>
      </header>

      {paragrafos(energia.orientacoes).length > 0 && (
        <section className="energia__claro">
          <div className="container">
            <h2>Orientações</h2>
            {paragrafos(energia.orientacoes).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      )}

      {secoes.map((secao) => (
        <section key={secao.id} className="energia__claro">
          <div className="container">
            {secao.titulo && <h2 className="energia__secao-titulo">{secao.titulo}</h2>}

            {secao.letras.some((l) => l.letra || l.numero) && (
              <div className="energia__letras-wrap">
                <table className="energia__letras">
                  <tbody>
                    <tr>
                      {secao.letras.map((par, i) => (
                        <th key={i} scope="col">{par.letra}</th>
                      ))}
                    </tr>
                    <tr>
                      {secao.letras.map((par, i) => (
                        <td key={i}>{par.numero}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {secao.tabelas.map((tabela, iTabela) => {
              const linhas = tabela.linhas.filter((l) => l.rotulo || l.valor);
              if (linhas.length === 0) return null;
              return (
                <table key={iTabela} className="energia__info">
                  <tbody>
                    {linhas.map((linha, i) => (
                      <tr key={i}>
                        <th scope="row">{linha.rotulo}</th>
                        <td>{linha.valor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })}

            {paragrafos(secao.texto).map((p, i) => (
              <p key={i} className="energia__texto">{p}</p>
            ))}
          </div>
        </section>
      ))}

      <footer className="energia__rodape">
        <div className="container">
          <p className="energia__gratidao">
            Gratidão pela confiança em acessar a energia vibracional do seu nome.
            Que esse mergulho traga clareza, conexão e caminhos mais alinhados com a sua essência!
          </p>
          <span className="section-mark" aria-hidden="true">✦</span>
          <a className="energia__marca" href="https://instagram.com/intua.guia" target="_blank" rel="noreferrer">
            <img src="/intua-guia-logo.svg" alt="Intua Guia" />
            <span>@intua.guia</span>
          </a>
        </div>
      </footer>
    </main>
  );
}
