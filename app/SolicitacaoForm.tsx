"use client";

import { useState } from "react";

const TIPOS_LEITURA = [
  "Se Desvendando",
  "Círculo de Afetos",
  "Caminhos e Desafios",
  "Equilíbrio Energético",
  "Duas Perguntas",
  "Mandala Astrológica",
  "Tiragem Cigana",
];

export default function SolicitacaoForm() {
  const [nome, setNome] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [tipo, setTipo] = useState("");
  const [perguntas, setPerguntas] = useState("");
  const [status, setStatus] = useState<"idle" | "enviando" | "erro">("idle");
  const [erro, setErro] = useState("");
  const [link, setLink] = useState("");
  const [copiado, setCopiado] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("enviando");
    setErro("");

    try {
      const response = await fetch("/api/leituras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consulenteNome: nome,
          consulenteNascimento: nascimento,
          tipoLeitura: tipo,
          perguntas,
        }),
      });
      const data = (await response.json()) as { token?: string; error?: string };

      if (!response.ok || !data.token) {
        setErro(data.error ?? "Não foi possível enviar. Tente novamente.");
        setStatus("erro");
        return;
      }

      setLink(`${window.location.origin}/leitura/${data.token}`);
    } catch {
      setErro("Não foi possível enviar. Verifique sua conexão e tente novamente.");
      setStatus("erro");
    }
  }

  if (link) {
    return (
      <div className="solicitacao-sucesso">
        <span className="section-mark" aria-hidden="true">✦</span>
        <h2>Pedido enviado!</h2>
        <p>Guarde ou copie o link abaixo — é por ele que você vai acompanhar sua leitura assim que a Vanessa preparar.</p>
        <div className="solicitacao-link">
          <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
          <button
            type="button"
            className="button button--coral button--small"
            onClick={async () => {
              await navigator.clipboard.writeText(link);
              setCopiado(true);
              window.setTimeout(() => setCopiado(false), 2000);
            }}
          >
            {copiado ? "Copiado!" : "Copiar link"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="solicitacao-form" onSubmit={handleSubmit}>
      <label>
        <span>Nome completo da pessoa a ser consultada</span>
        <input
          type="text"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome completo"
        />
      </label>

      <label>
        <span>Data de nascimento</span>
        <input
          type="date"
          value={nascimento}
          onChange={(e) => setNascimento(e.target.value)}
        />
      </label>

      <label>
        <span>Tipo de leitura</span>
        <select required value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="" disabled>Escolha uma leitura</option>
          {TIPOS_LEITURA.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>

      <label>
        <span>O que você gostaria de perguntar?</span>
        <textarea
          rows={4}
          value={perguntas}
          onChange={(e) => setPerguntas(e.target.value)}
          placeholder="Conte um pouco do contexto e das suas dúvidas"
        />
      </label>

      {erro && <p className="solicitacao-erro">{erro}</p>}

      <button type="submit" className="button button--coral" disabled={status === "enviando"}>
        {status === "enviando" ? "Enviando..." : "Enviar pedido"}
      </button>
    </form>
  );
}
