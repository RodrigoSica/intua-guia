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
  "Personalizada",
];

// Mesmo formulário público de /solicitar, mais os campos de negócio que só
// fazem sentido quando é a Vanessa quem está cadastrando (a consulente não
// preencheria "quem indicou você" sobre si mesma). O objetivo é a leitura já
// nascer completa no dashboard, sem ela precisar voltar lá depois para
// preencher telefone, valor e canal um por um.
export default function AdminSolicitarForm() {
  const [nome, setNome] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [tipo, setTipo] = useState("");
  const [perguntas, setPerguntas] = useState("");
  const [telefone, setTelefone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [dataAgendada, setDataAgendada] = useState("");
  const [veioPorOnde, setVeioPorOnde] = useState("");
  const [quemIndicou, setQuemIndicou] = useState("");
  const [valorConsulta, setValorConsulta] = useState("");
  const [pagamento, setPagamento] = useState("pendente");

  const [status, setStatus] = useState<"idle" | "enviando" | "erro">("idle");
  const [erro, setErro] = useState("");
  const [leituraId, setLeituraId] = useState("");

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
          telefone,
          instagram,
          dataAgendada,
          veioPorOnde,
          quemIndicou,
          valorConsulta,
          status: pagamento,
        }),
      });
      const data = (await response.json()) as { id?: string; token?: string; error?: string };

      if (!response.ok || !data.id) {
        setErro(data.error ?? "Não foi possível enviar. Tente novamente.");
        setStatus("erro");
        return;
      }

      setLeituraId(data.id);
    } catch {
      setErro("Não foi possível enviar. Verifique sua conexão e tente novamente.");
      setStatus("erro");
    }
  }

  if (leituraId) {
    return (
      <div className="solicitacao-sucesso">
        <span className="section-mark" aria-hidden="true">✦</span>
        <h2>Leitura criada!</h2>
        <p>Já está no dashboard. O link para a consulente só nasce quando você publicar, lá no fim da montagem.</p>
        <a className="button button--coral button--small" href={`/admin/leitura/${leituraId}`}>
          Montar leitura
        </a>
        <a className="admin__voltar admin-solicitar__outra" href="/admin/solicitar">
          + Cadastrar outra leitura
        </a>
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
        <span>Tipo de leitura</span>
        <select required value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="" disabled>Escolha uma leitura</option>
          {TIPOS_LEITURA.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>

      <div className="admin-preform__grade">
        <label>
          <span>Telefone</span>
          <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="16 99999-9999" />
        </label>

        <label>
          <span>Instagram</span>
          <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@usuario" />
        </label>

        <label>
          <span>Data de nascimento</span>
          <input type="date" value={nascimento} onChange={(e) => setNascimento(e.target.value)} />
        </label>

        <label>
          <span>Data agendada</span>
          <input type="date" value={dataAgendada} onChange={(e) => setDataAgendada(e.target.value)} />
        </label>

        <label>
          <span>Veio por onde</span>
          <input
            type="text"
            list="admin-clientes-canais"
            value={veioPorOnde}
            onChange={(e) => setVeioPorOnde(e.target.value)}
            placeholder="Indicação, Instagram..."
          />
        </label>

        <label>
          <span>Quem indicou</span>
          <input type="text" value={quemIndicou} onChange={(e) => setQuemIndicou(e.target.value)} placeholder="Nome de quem indicou" />
        </label>

        <label>
          <span>Valor da consulta</span>
          <input
            type="number"
            min="0"
            step="1"
            value={valorConsulta}
            onChange={(e) => setValorConsulta(e.target.value)}
            placeholder="0"
          />
        </label>

        <label>
          <span>Pagamento</span>
          <select value={pagamento} onChange={(e) => setPagamento(e.target.value)}>
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
          </select>
        </label>
      </div>

      <label>
        <span>O que ela gostaria de perguntar?</span>
        <textarea
          rows={4}
          value={perguntas}
          onChange={(e) => setPerguntas(e.target.value)}
          placeholder="Conte um pouco do contexto e das dúvidas"
        />
      </label>

      <datalist id="admin-clientes-canais">
        <option value="WhatsApp" />
        <option value="Recorrente" />
        <option value="Indicação" />
        <option value="Presencial" />
        <option value="Instagram" />
      </datalist>

      {erro && <p className="solicitacao-erro">{erro}</p>}

      <button type="submit" className="button button--coral" disabled={status === "enviando"}>
        {status === "enviando" ? "Criando..." : "Criar leitura"}
      </button>
    </form>
  );
}
