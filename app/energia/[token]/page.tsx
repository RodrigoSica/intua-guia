import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { energiaAudios, energias } from "../../../db/schema";
import type { Secao } from "../../AdminEnergiaBuilder";
import EnergiaDownloadButton from "../../EnergiaDownloadButton";
import { linhasAutomaticas } from "../../../lib/energiaVibracional";

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
  const audios = await db
    .select()
    .from(energiaAudios)
    .where(eq(energiaAudios.energiaId, energia.id))
    .orderBy(asc(energiaAudios.secaoId), asc(energiaAudios.ordem));
  const audiosDasOrientacoes = audios.filter((audio) => audio.secaoId === null);

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
            {audiosDasOrientacoes.length > 0 && (
              <div className="energia__audios">
                {audiosDasOrientacoes.map((audio, i) => (
                  <audio key={audio.id} controls preload="none" src={`/midia/${audio.r2Key}`} aria-label={`Áudio das orientações ${i + 1}`} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {secoes.map((secao) => (
        <section key={secao.id} className="energia__claro">
          <div className="container">
            {secao.titulo && <h2 className="energia__secao-titulo">{secao.titulo}</h2>}

            {secao.letras.some((l) => l.letra || l.numero) && (
              <div className="energia__letras-verticais">
                {secao.letras.map((par, i) => {
                  const audiosDaLetra = audios.filter(
                    (audio) => audio.secaoId === secao.id && audio.letraIndice === i
                  );
                  return (
                    <div key={i} className="energia__letra-linha">
                      <div className="energia__letra-identidade">
                        <strong>{par.letra}</strong>
                        <span>{par.numero}</span>
                      </div>
                      {audiosDaLetra.length > 0 && (
                        <div className="energia__audios energia__audios--letra">
                          {audiosDaLetra.map((audio) => (
                            <audio key={audio.id} controls preload="none" src={`/midia/${audio.r2Key}`} aria-label={`Leitura da letra ${par.letra}`} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {secao.letras.length > 0 && (
              <table className="energia__info energia__info--automatica">
                <tbody>
                  {linhasAutomaticas(secao.letras).map((linha) => (
                    <tr key={linha.rotulo}>
                      <th scope="row">{linha.rotulo}</th>
                      <td>{linha.valor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            {audios.filter((audio) => audio.secaoId === secao.id).length > 0 && (
              <div className="energia__audios">
                {audios.filter((audio) => audio.secaoId === secao.id).map((audio, i) => (
                  <audio key={audio.id} controls preload="none" src={`/midia/${audio.r2Key}`} aria-label={`Áudio do bloco ${i + 1}`} />
                ))}
              </div>
            )}
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
          <EnergiaDownloadButton consulenteNome={energia.consulenteNome} />
          <a className="energia__marca" href="https://instagram.com/intua.guia" target="_blank" rel="noreferrer">
            <img src="/intua-guia-logo.svg" alt="Intua Guia" />
            <span>@intua.guia</span>
          </a>
        </div>
      </footer>
    </main>
  );
}
