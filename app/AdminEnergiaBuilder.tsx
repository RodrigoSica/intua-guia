"use client";

import { useEffect, useRef, useState } from "react";

// Forma das seções guardadas em `energias.secoes` (JSON). Cada seção é um
// pedaço do nome: a grade de letras/números, quantas tabelas de apoio ela
// quiser, e os parágrafos de interpretação.
export type Letra = { letra: string; numero: string };
export type Tabela = { linhas: { rotulo: string; valor: string }[] };
export type Secao = {
  id: string;
  titulo: string;
  letras: Letra[];
  tabelas: Tabela[];
  texto: string;
};

type Energia = {
  id: string;
  token: string;
  consulenteNome: string;
  orientacoes: string | null;
  secoes: string | null;
  status: string;
};

function novaSecao(): Secao {
  return {
    id: crypto.randomUUID(),
    titulo: "",
    letras: [{ letra: "", numero: "" }],
    tabelas: [{ linhas: [{ rotulo: "", valor: "" }] }],
    texto: "",
  };
}

export default function AdminEnergiaBuilder({ energiaId }: { energiaId: string }) {
  const [energia, setEnergia] = useState<Energia | null>(null);
  const [nome, setNome] = useState("");
  const [orientacoes, setOrientacoes] = useState("");
  const [secoes, setSecoes] = useState<Secao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [estadoSalvo, setEstadoSalvo] = useState<"salvo" | "salvando" | "erro">("salvo");
  const [publicando, setPublicando] = useState(false);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/admin/energias/${energiaId}`);
      const data = await res.json();
      if (data.energia) {
        setEnergia(data.energia);
        setNome(data.energia.consulenteNome);
        setOrientacoes(data.energia.orientacoes ?? "");
        try {
          setSecoes(JSON.parse(data.energia.secoes ?? "[]"));
        } catch {
          setSecoes([]);
        }
      }
      setCarregando(false);
    })();
  }, [energiaId]);

  // O documento é salvo inteiro, ~800ms depois da última tecla. Um PATCH por
  // caractere seria desperdício, e salvar só no fim obrigaria a Vanessa a
  // lembrar de clicar em algo — que é justamente o tipo de passo que faz
  // alguém perder trabalho.
  function agendarSalvar(dados: { nome?: string; orientacoes?: string; secoes?: Secao[] }) {
    setEstadoSalvo("salvando");
    if (timerRef.current) window.clearTimeout(timerRef.current);

    timerRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/energias/${energiaId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            consulenteNome: dados.nome ?? nome,
            orientacoes: dados.orientacoes ?? orientacoes,
            secoes: dados.secoes ?? secoes,
          }),
        });
        setEstadoSalvo(res.ok ? "salvo" : "erro");
      } catch {
        setEstadoSalvo("erro");
      }
    }, 800);
  }

  function atualizarSecoes(novas: Secao[]) {
    setSecoes(novas);
    agendarSalvar({ secoes: novas });
  }

  function mudarSecao(indice: number, mudanca: Partial<Secao>) {
    atualizarSecoes(secoes.map((s, i) => (i === indice ? { ...s, ...mudanca } : s)));
  }

  async function publicar() {
    setPublicando(true);
    try {
      // Garante que a última digitação foi para o banco antes de publicar —
      // sem isso, o que ela escreveu nos últimos 800ms não entraria no link.
      if (timerRef.current) window.clearTimeout(timerRef.current);
      await fetch(`/api/admin/energias/${energiaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consulenteNome: nome, orientacoes, secoes }),
      });
      setEstadoSalvo("salvo");

      const res = await fetch(`/api/admin/energias/${energiaId}/publicar`, { method: "POST" });
      const data = await res.json();
      if (data.energia) setEnergia(data.energia);
    } finally {
      setPublicando(false);
    }
  }

  if (carregando) return <p className="admin__carregando">Carregando...</p>;
  if (!energia) return <p className="admin__carregando">Documento não encontrado.</p>;

  const link = typeof window !== "undefined" ? `${window.location.origin}/energia/${energia.token}` : "";

  return (
    <div className="admin-energia">
      <p className="eyebrow">Energia vibracional do nome</p>
      <input
        className="admin-energia__nome"
        value={nome}
        onChange={(e) => {
          setNome(e.target.value);
          agendarSalvar({ nome: e.target.value });
        }}
        placeholder="Nome da pessoa"
      />
      <span className="section-mark" aria-hidden="true">✦</span>

      <div className="admin-builder__link">
        <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
        <a className="button button--outline button--small" href={`/energia/${energia.token}`} target="_blank" rel="noreferrer">
          Ver
        </a>
        {energia.status === "publicada" ? (
          <span className="admin__status admin__status--publicada">Publicada</span>
        ) : (
          <button type="button" className="button button--coral button--small" onClick={publicar} disabled={publicando}>
            {publicando ? "Publicando..." : "Publicar"}
          </button>
        )}
      </div>

      <p className={`admin-energia__salvo admin-energia__salvo--${estadoSalvo}`}>
        {estadoSalvo === "salvo" && "✓ Salvo"}
        {estadoSalvo === "salvando" && "Salvando..."}
        {estadoSalvo === "erro" && "⚠ Não foi possível salvar — verifique a conexão."}
      </p>

      <section className="admin-energia__bloco">
        <h2 className="admin-builder__subtitulo">Orientações</h2>
        <textarea
          rows={6}
          value={orientacoes}
          onChange={(e) => {
            setOrientacoes(e.target.value);
            agendarSalvar({ orientacoes: e.target.value });
          }}
          placeholder="Texto de abertura do documento"
        />
        <p className="admin-momento-form__ajuda">Uma linha em branco separa os parágrafos.</p>
      </section>

      <h2 className="admin-builder__subtitulo">Blocos do nome ({secoes.length})</h2>

      {secoes.map((secao, iSecao) => (
        <section key={secao.id} className="admin-energia__bloco">
          <div className="admin-energia__bloco-topo">
            <input
              className="admin-energia__titulo"
              value={secao.titulo}
              onChange={(e) => mudarSecao(iSecao, { titulo: e.target.value.toLocaleUpperCase("pt-BR") })}
              placeholder="RAFAELA"
            />
            <button
              type="button"
              className="admin-energia__remover"
              onClick={() => {
                if (window.confirm(`Remover o bloco "${secao.titulo || iSecao + 1}"?`)) {
                  atualizarSecoes(secoes.filter((_, i) => i !== iSecao));
                }
              }}
              aria-label="Remover bloco"
            >
              ×
            </button>
          </div>

          <div className="admin-energia__campo">
            <span className="admin-energia__rotulo">Letras e números</span>
            <div className="admin-energia__letras">
              {secao.letras.map((par, iLetra) => (
                <div key={iLetra} className="admin-energia__coluna">
                  <input
                    className="admin-energia__letra"
                    value={par.letra}
                    maxLength={2}
                    onChange={(e) =>
                      mudarSecao(iSecao, {
                        letras: secao.letras.map((p, i) =>
                          i === iLetra ? { ...p, letra: e.target.value.toLocaleUpperCase("pt-BR") } : p
                        ),
                      })
                    }
                    aria-label={`Letra ${iLetra + 1}`}
                  />
                  <input
                    className="admin-energia__numero"
                    value={par.numero}
                    onChange={(e) =>
                      mudarSecao(iSecao, {
                        letras: secao.letras.map((p, i) =>
                          i === iLetra ? { ...p, numero: e.target.value } : p
                        ),
                      })
                    }
                    aria-label={`Número da letra ${iLetra + 1}`}
                  />
                  <button
                    type="button"
                    className="admin-energia__remover admin-energia__remover--coluna"
                    onClick={() =>
                      mudarSecao(iSecao, { letras: secao.letras.filter((_, i) => i !== iLetra) })
                    }
                    aria-label={`Remover coluna ${iLetra + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="button button--outline button--small"
              onClick={() => mudarSecao(iSecao, { letras: [...secao.letras, { letra: "", numero: "" }] })}
            >
              + Coluna
            </button>
          </div>

          <div className="admin-energia__campo">
            <span className="admin-energia__rotulo">Informações complementares</span>
            {secao.tabelas.map((tabela, iTabela) => (
              <div key={iTabela} className="admin-energia__tabela">
                {tabela.linhas.map((linha, iLinha) => (
                  <div key={iLinha} className="admin-energia__linha">
                    <input
                      className="admin-energia__rotulo-campo"
                      value={linha.rotulo}
                      onChange={(e) =>
                        mudarSecao(iSecao, {
                          tabelas: secao.tabelas.map((t, i) =>
                            i === iTabela
                              ? {
                                  linhas: t.linhas.map((l, j) =>
                                    j === iLinha ? { ...l, rotulo: e.target.value } : l
                                  ),
                                }
                              : t
                          ),
                        })
                      }
                      placeholder="Vogais: 4"
                    />
                    <input
                      value={linha.valor}
                      onChange={(e) =>
                        mudarSecao(iSecao, {
                          tabelas: secao.tabelas.map((t, i) =>
                            i === iTabela
                              ? {
                                  linhas: t.linhas.map((l, j) =>
                                    j === iLinha ? { ...l, valor: e.target.value } : l
                                  ),
                                }
                              : t
                          ),
                        })
                      }
                      placeholder="Desenvolvimento espiritual"
                    />
                    <button
                      type="button"
                      className="admin-energia__remover"
                      onClick={() =>
                        mudarSecao(iSecao, {
                          tabelas: secao.tabelas.map((t, i) =>
                            i === iTabela ? { linhas: t.linhas.filter((_, j) => j !== iLinha) } : t
                          ),
                        })
                      }
                      aria-label="Remover linha"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="admin-energia__tabela-acoes">
                  <button
                    type="button"
                    className="button button--outline button--small"
                    onClick={() =>
                      mudarSecao(iSecao, {
                        tabelas: secao.tabelas.map((t, i) =>
                          i === iTabela ? { linhas: [...t.linhas, { rotulo: "", valor: "" }] } : t
                        ),
                      })
                    }
                  >
                    + Linha
                  </button>
                  <button
                    type="button"
                    className="admin-energia__remover"
                    onClick={() =>
                      mudarSecao(iSecao, { tabelas: secao.tabelas.filter((_, i) => i !== iTabela) })
                    }
                  >
                    Remover tabela
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="button button--outline button--small"
              onClick={() =>
                mudarSecao(iSecao, {
                  tabelas: [...secao.tabelas, { linhas: [{ rotulo: "", valor: "" }] }],
                })
              }
            >
              + Tabela
            </button>
          </div>

          <div className="admin-energia__campo">
            <span className="admin-energia__rotulo">Texto da leitura</span>
            <textarea
              rows={5}
              value={secao.texto}
              onChange={(e) => mudarSecao(iSecao, { texto: e.target.value })}
              placeholder="Interpretação deste bloco do nome"
            />
          </div>
        </section>
      ))}

      <button
        type="button"
        className="button button--coral admin-energia__adicionar"
        onClick={() => atualizarSecoes([...secoes, novaSecao()])}
      >
        <span aria-hidden="true">+</span> Novo bloco do nome
      </button>
    </div>
  );
}
