"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  instagram: string | null;
  notas: string | null;
  criadoEm: string;
};

type Campo = Exclude<keyof Cliente, "id" | "leituraId" | "criadoEm">;

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

// As datas vêm do banco como "AAAA-MM-DD". Lemos os pedaços como texto em vez
// de usar new Date(): no fuso do Brasil, new Date("2026-04-13") volta como dia
// 12 (a string é interpretada como UTC), o que trocaria o mês de quem foi
// atendida no dia 1º.
function mesIndice(data: string | null) {
  if (!data) return null;
  const mes = Number(data.slice(5, 7)) - 1;
  return mes >= 0 && mes <= 11 ? mes : null;
}

function mesDe(data: string | null) {
  const i = mesIndice(data);
  return i === null ? "—" : MESES[i];
}

function dataBR(data: string | null) {
  if (!data) return "";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function idadeDe(nascimento: string | null) {
  if (!nascimento) return null;
  const hoje = new Date();
  const [ano, mes, dia] = nascimento.split("-").map(Number);
  if (!ano) return null;
  let idade = hoje.getFullYear() - ano;
  const jaFezAniversario =
    hoje.getMonth() + 1 > mes || (hoje.getMonth() + 1 === mes && hoje.getDate() >= dia);
  if (!jaFezAniversario) idade -= 1;
  return idade;
}

// "55 16 98136-9009" → "5516981369009". A Vanessa conversa com todo mundo por
// WhatsApp; deixar o telefone como texto morto obriga ela a copiar, limpar e
// colar em outro app toda vez.
function linkWhatsApp(telefone: string | null) {
  if (!telefone) return null;
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length < 10) return null;
  return `https://wa.me/${digitos}`;
}

function linkInstagram(instagram: string | null) {
  if (!instagram) return null;
  const usuario = instagram.trim().replace(/^@/, "").replace(/\s/g, "");
  if (!usuario || usuario === "-") return null;
  return `https://instagram.com/${usuario}`;
}

function normalizarNome(nome: string) {
  return nome.trim().toLocaleLowerCase("pt-BR");
}

function moeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminClientesDashboard() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [nomeNovo, setNomeNovo] = useState("");
  const [criando, setCriando] = useState(false);
  const [errosLinha, setErrosLinha] = useState<Record<string, string>>({});

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroMes, setFiltroMes] = useState("todos");

  // Salvamentos adiados, por "idDoCliente:campo".
  const timersRef = useRef<Record<string, number>>({});

  async function carregar() {
    const res = await fetch("/api/admin/clientes");
    const data = await res.json();
    setClientes(data.clientes ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function salvarCampo(id: string, campo: Campo, valor: string) {
    setErrosLinha((atual) => ({ ...atual, [id]: "" }));
    try {
      const res = await fetch(`/api/admin/clientes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [campo]: valor === "" ? null : valor }),
      });
      if (!res.ok) {
        setErrosLinha((atual) => ({ ...atual, [id]: "Não salvou — edite de novo." }));
      }
    } catch {
      setErrosLinha((atual) => ({ ...atual, [id]: "Sem conexão — edite de novo." }));
    }
  }

  // Os campos são controlados (value + onChange), e não defaultValue. Com uma
  // lista que filtra, o input não-controlado é uma armadilha: quando a linha
  // sai do filtro o React desmonta o campo, e o que estava digitado ali só
  // existia no DOM — some sem nunca chegar ao servidor, ou pior, ressuscita
  // no lugar errado quando a linha volta. Com o valor no estado isso não
  // acontece.
  //
  // O salvamento é adiado ~600ms para não disparar um PATCH por tecla; o blur
  // (e a troca de um <select>) força o envio na hora. Assim, mesmo que a linha
  // desapareça do filtro no meio da digitação, o que ela escreveu já está a
  // caminho do banco.
  function editar(id: string, campo: Campo, valor: string, imediato = false) {
    setClientes((atual) =>
      atual.map((c) => (c.id === id ? { ...c, [campo]: valor === "" ? null : valor } : c))
    );

    const chave = `${id}:${campo}`;
    const timers = timersRef.current;
    if (timers[chave]) window.clearTimeout(timers[chave]);

    if (imediato) {
      delete timers[chave];
      salvarCampo(id, campo, valor);
      return;
    }

    timers[chave] = window.setTimeout(() => {
      delete timers[chave];
      salvarCampo(id, campo, valor);
    }, 600);
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

  async function removerCliente(cliente: Cliente) {
    const aviso = cliente.leituraId
      ? `Remover ${cliente.nome} do dashboard?\n\nA leitura dela continua publicada e o link que ela recebeu segue funcionando — sai só a linha daqui.`
      : `Remover ${cliente.nome} do dashboard?`;
    if (!window.confirm(aviso)) return;

    const res = await fetch(`/api/admin/clientes/${cliente.id}`, { method: "DELETE" });
    if (res.ok) {
      setClientes((atual) => atual.filter((c) => c.id !== cliente.id));
    } else {
      setErrosLinha((atual) => ({ ...atual, [cliente.id]: "Não foi possível remover." }));
    }
  }

  // Quantas vezes cada pessoa já foi atendida — a planilha registrava isso à
  // mão marcando o canal como "Recorrente", o que só valia para o próximo
  // atendimento e não dizia quantos vieram antes.
  const atendimentosPorPessoa = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const c of clientes) {
      const chave = normalizarNome(c.nome);
      mapa.set(chave, (mapa.get(chave) ?? 0) + 1);
    }
    return mapa;
  }, [clientes]);

  const mesesComDados = useMemo(() => {
    const indices = new Set<number>();
    for (const c of clientes) {
      const i = mesIndice(c.dataAgendada);
      if (i !== null) indices.add(i);
    }
    return [...indices].sort((a, b) => a - b);
  }, [clientes]);

  const aniversariantes = useMemo(() => {
    const mesAtual = new Date().getMonth();
    const vistos = new Set<string>();
    return clientes.filter((c) => {
      if (mesIndice(c.dataNascimento) !== mesAtual) return false;
      const chave = normalizarNome(c.nome);
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    });
  }, [clientes]);

  const lista = useMemo(() => {
    const termo = normalizarNome(busca);
    return clientes.filter((c) => {
      if (filtroStatus !== "todos" && c.status !== filtroStatus) return false;
      if (filtroMes !== "todos" && String(mesIndice(c.dataAgendada)) !== filtroMes) return false;
      if (!termo) return true;
      const alvo = [c.nome, c.telefone, c.quemIndicou, c.instagram, c.atendimento, c.notas]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR");
      return alvo.includes(termo);
    });
  }, [clientes, busca, filtroStatus, filtroMes]);

  const totais = useMemo(() => {
    let recebido = 0;
    let aReceber = 0;
    let pagos = 0;
    for (const c of lista) {
      const valor = Number(c.valorConsulta) || 0;
      if (c.status === "pago") {
        recebido += valor;
        pagos += 1;
      } else {
        aReceber += valor;
      }
    }
    return { recebido, aReceber, pagos, ticket: pagos ? recebido / pagos : 0 };
  }, [lista]);

  // Exporta o que está na tela (respeitando busca e filtros). Separador ";" e
  // BOM no início porque é assim que o Excel em português abre o arquivo com
  // os acentos certos e as colunas já separadas.
  function exportarCSV() {
    const cabecalho = [
      "Nome", "Veio por onde", "Atendimento", "Valor da consulta", "Status",
      "Data nascimento", "Telefone", "Instagram", "Data agendada", "Mês",
      "Quem indicou", "Notas",
    ];
    const linhas = lista.map((c) => [
      c.nome, c.veioPorOnde ?? "", c.atendimento ?? "", c.valorConsulta ?? "",
      c.status === "pago" ? "Pago" : "Pendente", dataBR(c.dataNascimento), c.telefone ?? "",
      c.instagram ?? "", dataBR(c.dataAgendada), mesDe(c.dataAgendada),
      c.quemIndicou ?? "", c.notas ?? "",
    ]);

    const csv = [cabecalho, ...linhas]
      .map((linha) => linha.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");

    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `consulentes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (carregando) return <p className="admin__carregando">Carregando...</p>;

  const filtrando = busca !== "" || filtroStatus !== "todos" || filtroMes !== "todos";

  return (
    <div className="admin-clientes">
      <div className="admin-cards">
        <div className="admin-card">
          <span className="admin-card__valor">{lista.length}</span>
          <span className="admin-card__rotulo">{filtrando ? "no filtro" : "atendimentos"}</span>
        </div>
        <div className="admin-card">
          <span className="admin-card__valor">{moeda(totais.recebido)}</span>
          <span className="admin-card__rotulo">recebido</span>
        </div>
        <div className={`admin-card${totais.aReceber > 0 ? " admin-card--alerta" : ""}`}>
          <span className="admin-card__valor">{moeda(totais.aReceber)}</span>
          <span className="admin-card__rotulo">a receber</span>
        </div>
        <div className="admin-card">
          <span className="admin-card__valor">{moeda(totais.ticket)}</span>
          <span className="admin-card__rotulo">ticket médio</span>
        </div>
      </div>

      {aniversariantes.length > 0 && (
        <div className="admin-aniversarios">
          <strong>✦ Aniversariantes de {MESES[new Date().getMonth()]}:</strong>{" "}
          {aniversariantes.map((c, i) => (
            <span key={c.id}>
              {i > 0 && ", "}
              {linkWhatsApp(c.telefone) ? (
                <a href={linkWhatsApp(c.telefone)!} target="_blank" rel="noreferrer">
                  {c.nome.split(" ")[0]} (dia {c.dataNascimento?.slice(8, 10)})
                </a>
              ) : (
                <>{c.nome.split(" ")[0]} (dia {c.dataNascimento?.slice(8, 10)})</>
              )}
            </span>
          ))}
        </div>
      )}

      <div className="admin-filtros">
        <input
          type="search"
          className="admin-filtros__busca"
          placeholder="Buscar por nome, telefone, indicação..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="todos">Todos os status</option>
          <option value="pago">Pagos</option>
          <option value="pendente">Pendentes</option>
        </select>
        <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
          <option value="todos">Todos os meses</option>
          {mesesComDados.map((i) => (
            <option key={i} value={String(i)}>{MESES[i]}</option>
          ))}
        </select>
        <button type="button" className="button button--outline button--small" onClick={exportarCSV}>
          ↓ Exportar CSV
        </button>
      </div>

      {lista.length === 0 ? (
        <p className="admin__vazio">Nenhum atendimento com esses filtros.</p>
      ) : (
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
                <th>Instagram</th>
                <th>Data agendada</th>
                <th>Mês</th>
                <th>Quem indicou</th>
                <th>Notas</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => {
                const vezes = atendimentosPorPessoa.get(normalizarNome(c.nome)) ?? 1;
                const whats = linkWhatsApp(c.telefone);
                const insta = linkInstagram(c.instagram);
                const idade = idadeDe(c.dataNascimento);

                return (
                  <tr key={c.id} className={c.status === "pendente" ? "admin-linha--pendente" : undefined}>
                    <td data-label="Nome">
                      <div className="admin-celula-nome">
                        <input
                          type="text"
                          value={c.nome}
                          onChange={(e) => editar(c.id, "nome", e.target.value)}
                          onBlur={(e) => editar(c.id, "nome", e.target.value, true)}
                        />
                        <span className="admin-tags">
                          {vezes > 1 && <span className="admin-tag" title={`${vezes} atendimentos`}>{vezes}×</span>}
                          {c.leituraId && (
                            <a className="admin-tag admin-tag--link" href={`/admin/leitura/${c.leituraId}`} title="Abrir a leitura">
                              ✦ leitura
                            </a>
                          )}
                        </span>
                      </div>
                    </td>
                    <td data-label="Veio por onde">
                      <input
                        type="text"
                        list="admin-clientes-canais"
                        value={c.veioPorOnde ?? ""}
                        onChange={(e) => editar(c.id, "veioPorOnde", e.target.value)}
                        onBlur={(e) => editar(c.id, "veioPorOnde", e.target.value, true)}
                      />
                    </td>
                    <td data-label="Atendimento">
                      <input
                        type="text"
                        list="admin-clientes-atendimentos"
                        value={c.atendimento ?? ""}
                        onChange={(e) => editar(c.id, "atendimento", e.target.value)}
                        onBlur={(e) => editar(c.id, "atendimento", e.target.value, true)}
                      />
                    </td>
                    <td data-label="Valor">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={c.valorConsulta ?? ""}
                        onChange={(e) => editar(c.id, "valorConsulta", e.target.value)}
                        onBlur={(e) => editar(c.id, "valorConsulta", e.target.value, true)}
                      />
                    </td>
                    <td data-label="Status">
                      <select
                        value={c.status}
                        onChange={(e) => editar(c.id, "status", e.target.value, true)}
                      >
                        <option value="pendente">Pendente</option>
                        <option value="pago">Pago</option>
                      </select>
                    </td>
                    <td data-label="Nascimento">
                      <div className="admin-celula-nasc">
                        <input
                          type="date"
                          value={c.dataNascimento ?? ""}
                          onChange={(e) => editar(c.id, "dataNascimento", e.target.value, true)}
                        />
                        {idade !== null && <span className="admin-celula-nasc__idade">{idade}a</span>}
                      </div>
                    </td>
                    <td data-label="Telefone">
                      <div className="admin-celula-contato">
                        <input
                          type="text"
                          value={c.telefone ?? ""}
                          onChange={(e) => editar(c.id, "telefone", e.target.value)}
                          onBlur={(e) => editar(c.id, "telefone", e.target.value, true)}
                        />
                        {whats && (
                          <a className="admin-contato-botao" href={whats} target="_blank" rel="noreferrer" title="Abrir no WhatsApp">
                            WhatsApp
                          </a>
                        )}
                      </div>
                    </td>
                    <td data-label="Instagram">
                      <div className="admin-celula-contato">
                        <input
                          type="text"
                          placeholder="@usuario"
                          value={c.instagram ?? ""}
                          onChange={(e) => editar(c.id, "instagram", e.target.value)}
                          onBlur={(e) => editar(c.id, "instagram", e.target.value, true)}
                        />
                        {insta && (
                          <a className="admin-contato-botao" href={insta} target="_blank" rel="noreferrer" title="Abrir o perfil">
                            Abrir
                          </a>
                        )}
                      </div>
                    </td>
                    <td data-label="Data agendada">
                      <input
                        type="date"
                        value={c.dataAgendada ?? ""}
                        onChange={(e) => editar(c.id, "dataAgendada", e.target.value, true)}
                      />
                    </td>
                    <td data-label="Mês" className="admin-clientes__mes">{mesDe(c.dataAgendada)}</td>
                    <td data-label="Quem indicou">
                      <input
                        type="text"
                        list="admin-clientes-nomes"
                        value={c.quemIndicou ?? ""}
                        onChange={(e) => editar(c.id, "quemIndicou", e.target.value)}
                        onBlur={(e) => editar(c.id, "quemIndicou", e.target.value, true)}
                      />
                    </td>
                    <td data-label="Notas">
                      <input
                        type="text"
                        value={c.notas ?? ""}
                        onChange={(e) => editar(c.id, "notas", e.target.value)}
                        onBlur={(e) => editar(c.id, "notas", e.target.value, true)}
                      />
                    </td>
                    <td data-label="" className="admin-clientes__acoes">
                      <button
                        type="button"
                        onClick={() => removerCliente(c)}
                        aria-label={`Remover ${c.nome}`}
                        title="Remover do dashboard"
                      >
                        ×
                      </button>
                      {errosLinha[c.id] && <span className="admin-clientes__erro">{errosLinha[c.id]}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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
      {/* Quem indicou é quase sempre outra consulente já cadastrada — sugerir
          os nomes existentes evita a mesma pessoa virar três grafias diferentes. */}
      <datalist id="admin-clientes-nomes">
        {[...new Set(clientes.map((c) => c.nome))].map((nome) => (
          <option key={nome} value={nome} />
        ))}
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
