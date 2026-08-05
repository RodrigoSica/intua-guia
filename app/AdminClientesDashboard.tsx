"use client";

import { useEffect, useState } from "react";

type Cliente = {
  id: string;
  leituraId: string | null;
  nome: string;
  veioPorOnde: string | null;
  atendimento: string | null;
  valorConsulta: number | null;
  status: string;
  dataNascimento: string | null;
  telefone: string | null;
  dataAgendada: string | null;
  quemIndicou: string | null;
  criadoEm: string;
};

type Campo = Exclude<keyof Cliente, "id" | "leituraId" | "criadoEm">;

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function mesDe(dataAgendada: string | null) {
  if (!dataAgendada) return "—";
  const mes = Number(dataAgendada.slice(5, 7)) - 1;
  return MESES[mes] ?? "—";
}

export default function AdminClientesDashboard() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [nomeNovo, setNomeNovo] = useState("");
  const [criando, setCriando] = useState(false);
  const [errosLinha, setErrosLinha] = useState<Record<string, string>>({});

  async function carregar() {
    const res = await fetch("/api/admin/clientes");
    const data = await res.json();
    setClientes(data.clientes ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  function atualizarLocal(id: string, campo: Campo, valor: string) {
    setClientes((atual) =>
      atual.map((c) => (c.id === id ? { ...c, [campo]: valor === "" ? null : valor } : c))
    );
  }

  async function salvarCampo(id: string, campo: Campo, valor: string) {
    setErrosLinha((atual) => ({ ...atual, [id]: "" }));
    try {
      const res = await fetch(`/api/admin/clientes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [campo]: valor === "" ? null : valor }),
      });
      if (!res.ok) {
        setErrosLinha((atual) => ({ ...atual, [id]: "Não salvou — tente de novo." }));
      }
    } catch {
      setErrosLinha((atual) => ({ ...atual, [id]: "Sem conexão — tente de novo." }));
    }
  }

  async function adicionarCliente(event: React.FormEvent) {
    event.preventDefault();
    const nome = nomeNovo.trim();
    if (!nome) return;
    setCriando(true);
    try {
      const res = await fetch("/api/admin/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome }),
      });
      if (res.ok) {
        setNomeNovo("");
        await carregar();
      }
    } finally {
      setCriando(false);
    }
  }

  if (carregando) return <p className="admin__carregando">Carregando...</p>;

  const totalPago = clientes
    .filter((c) => c.status === "pago")
    .reduce((soma, c) => soma + (Number(c.valorConsulta) || 0), 0);

  return (
    <div className="admin-clientes">
      <div className="admin-clientes__resumo">
        <span><strong>{clientes.length}</strong> cliente(s)</span>
        <span><strong>{clientes.filter((c) => c.status === "pago").length}</strong> pago(s)</span>
        <span><strong>R$ {totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong> recebido</span>
      </div>

      <div className="admin-clientes__tabela-wrap">
        <table className="admin-clientes__tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Veio por onde</th>
              <th>Atendimento</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Nascimento</th>
              <th>Telefone</th>
              <th>Data agendada</th>
              <th>Mês</th>
              <th>Quem indicou</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id}>
                <td>
                  <input
                    type="text"
                    defaultValue={c.nome}
                    onBlur={(e) => {
                      atualizarLocal(c.id, "nome", e.target.value);
                      salvarCampo(c.id, "nome", e.target.value);
                    }}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    list="admin-clientes-canais"
                    defaultValue={c.veioPorOnde ?? ""}
                    onBlur={(e) => salvarCampo(c.id, "veioPorOnde", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    list="admin-clientes-atendimentos"
                    defaultValue={c.atendimento ?? ""}
                    onBlur={(e) => salvarCampo(c.id, "atendimento", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={c.valorConsulta ?? ""}
                    onBlur={(e) => {
                      atualizarLocal(c.id, "valorConsulta", e.target.value);
                      salvarCampo(c.id, "valorConsulta", e.target.value);
                    }}
                  />
                </td>
                <td>
                  <select
                    defaultValue={c.status}
                    onChange={(e) => {
                      atualizarLocal(c.id, "status", e.target.value);
                      salvarCampo(c.id, "status", e.target.value);
                    }}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago</option>
                  </select>
                </td>
                <td>
                  <input
                    type="date"
                    defaultValue={c.dataNascimento ?? ""}
                    onBlur={(e) => salvarCampo(c.id, "dataNascimento", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    defaultValue={c.telefone ?? ""}
                    onBlur={(e) => salvarCampo(c.id, "telefone", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="date"
                    defaultValue={c.dataAgendada ?? ""}
                    onBlur={(e) => {
                      atualizarLocal(c.id, "dataAgendada", e.target.value);
                      salvarCampo(c.id, "dataAgendada", e.target.value);
                    }}
                  />
                </td>
                <td className="admin-clientes__mes">{mesDe(c.dataAgendada)}</td>
                <td>
                  <input
                    type="text"
                    defaultValue={c.quemIndicou ?? ""}
                    onBlur={(e) => salvarCampo(c.id, "quemIndicou", e.target.value)}
                  />
                  {errosLinha[c.id] && <span className="admin-clientes__erro">{errosLinha[c.id]}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <datalist id="admin-clientes-canais">
        <option value="WhatsApp" />
        <option value="Recorrente" />
        <option value="Indicação" />
        <option value="Presencial" />
        <option value="Instagram" />
      </datalist>
      <datalist id="admin-clientes-atendimentos">
        <option value="Se Desvendando" />
        <option value="Círculo de Afetos" />
        <option value="Caminhos e Desafios" />
        <option value="Equilíbrio Energético" />
        <option value="Duas Perguntas" />
        <option value="Mandala Astrológica" />
        <option value="Tiragem Cigana" />
        <option value="Personalizado" />
      </datalist>

      <form className="admin-clientes__novo" onSubmit={adicionarCliente}>
        <input
          type="text"
          placeholder="Nome do novo cliente"
          value={nomeNovo}
          onChange={(e) => setNomeNovo(e.target.value)}
        />
        <button type="submit" className="button button--outline button--small" disabled={criando}>
          <span aria-hidden="true">+</span> {criando ? "Adicionando..." : "Novo cliente"}
        </button>
      </form>
    </div>
  );
}
