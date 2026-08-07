"use client";

import { useEffect, useRef, useState } from "react";
import AdminEnergiaGravador, { type EnergiaAudio } from "./AdminEnergiaGravador";
import { letrasDoNome, linhasAutomaticas } from "../lib/energiaVibracional";

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
    letras: [],
    tabelas: [],
    texto: "",
  };
}

export default function AdminEnergiaBuilder({ energiaId }: { energiaId: string }) {
  const [energia, setEnergia] = useState<Energia | null>(null);
  const [nome, setNome] = useState("");
  const [orientacoes, setOrientacoes] = useState("");
  const [secoes, setSecoes] = useState<Secao[]>([]);
  const [audios, setAudios] = useState<EnergiaAudio[]>([]);
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
        setAudios(data.audios ?? []);
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

  function mudarTituloSecao(indice: number, titulo: string) {
    const normalizado = titulo.toLocaleUpperCase("pt-BR");
    mudarSecao(indice, { titulo: normalizado, letras: letrasDoNome(normalizado) });
  }

  function adicionarAudio(audio: EnergiaAudio) {
    setAudios((atuais) => [...atuais, audio]);
  }

  function removerAudio(id: string) {
    setAudios((atuais) => atuais.filter((audio) => audio.id !== id));
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
        <div className="admin-energia__gravador-principal">
          <span className="admin-energia__rotulo">Áudios das orientações</span>
          <AdminEnergiaGravador
            energiaId={energiaId}
            audios={audios.filter((audio) => audio.secaoId === null)}
            onAdicionar={adicionarAudio}
            onRemover={removerAudio}
          />
          <p className="admin-momento-form__ajuda">A gravação fica apenas anexada à leitura — sem transcrição ou pontos-chave.</p>
        </div>
      </section>

      <h2 className="admin-builder__subtitulo">Blocos do nome ({secoes.length})</h2>

      {secoes.map((secao, iSecao) => (
        <section key={secao.id} className="admin-energia__bloco">
          <div className="admin-energia__bloco-topo">
            <input
              className="admin-energia__titulo"
              value={secao.titulo}
              onChange={(e) => mudarTituloSecao(iSecao, e.target.value)}
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
            <span className="admin-energia__rotulo">Leitura vibracional por letra</span>
            <div className="admin-energia__numeros-horizontais" aria-label="Números das letras em ordem">
              {secao.letras.map((par, iLetra) => (
                <span key={iLetra} className="admin-energia__numero-par">
                  <strong>{par.letra}</strong>
                  <small>{par.numero}</small>
                </span>
              ))}
            </div>
            <div className="admin-energia__letras-verticais">
              {secao.letras.map((par, iLetra) => (
                <div key={iLetra} className="admin-energia__letra-linha">
                  <div className="admin-energia__letra-identidade">
                    <span className="admin-energia__letra">{par.letra}</span>
                  </div>
                  <AdminEnergiaGravador
                    compacto
                    energiaId={energiaId}
                    secaoId={secao.id}
                    letraIndice={iLetra}
                    audios={audios.filter((audio) => audio.secaoId === secao.id && audio.letraIndice === iLetra)}
                    onAdicionar={adicionarAudio}
                    onRemover={removerAudio}
                  />
                </div>
              ))}
            </div>
          </div>

          {secao.letras.length > 0 && (
            <div className="admin-energia__campo admin-energia__automatico">
              <span className="admin-energia__rotulo">Informações calculadas automaticamente</span>
              {linhasAutomaticas(secao.letras).map((linha) => (
                <div key={linha.rotulo} className="admin-energia__linha admin-energia__linha--automatica">
                  <span>{linha.rotulo}</span>
                  <strong>{linha.valor}</strong>
                </div>
              ))}
            </div>
          )}

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
