"use client";

import { useEffect, useState } from "react";

type Energia = {
  id: string;
  consulenteNome: string;
  status: string;
  criadaEm: string;
};

// Os mesmos campos que o dashboard mostra. A Vanessa preenche uma vez aqui, na
// abertura do trabalho, e o atendimento já nasce completo lá — em vez de criar
// o documento agora e ter que voltar depois para dizer quem é, quanto custou e
// por onde a pessoa chegou.
const VAZIO = {
  consulenteNome: "",
  telefone: "",
  instagram: "",
  dataNascimento: "",
  veioPorOnde: "",
  quemIndicou: "",
  valorConsulta: "",
  status: "pendente",
  dataAgendada: "",
};

export default function AdminEnergiaLista() {
  const [energias, setEnergias] = useState<Energia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState(VAZIO);
  const [aberto, setAberto] = useState(false);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState("");

  async function carregar() {
    const res = await fetch("/api/admin/energias");
    const data = await res.json();
    setEnergias(data.energias ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  function mudar(campo: keyof typeof VAZIO, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function criar(event: React.FormEvent) {
    event.preventDefault();
    if (!form.consulenteNome.trim()) return;

    setCriando(true);
    setErro("");
    try {
      const res = await fetch("/api/admin/energias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { id?: string; error?: string };

      if (!res.ok || !data.id) {
        setErro(data.error ?? "Não foi possível criar. Tente novamente.");
        return;
      }
      // Vai direto para o documento: os blocos do nome já foram montados a
      // partir do nome digitado, então o próximo passo é preencher.
      window.location.href = `/admin/energia/${data.id}`;
    } catch {
      setErro("Não foi possível criar. Verifique sua conexão.");
    } finally {
      setCriando(false);
    }
  }

  async function remover(energia: Energia) {
    if (!window.confirm(`Apagar a leitura de ${energia.consulenteNome}?\n\nOs áudios são apagados junto, o link enviado para ela para de funcionar e o atendimento sai do dashboard. Não tem como desfazer.`)) {
      return;
    }
    const res = await fetch(`/api/admin/energias/${energia.id}`, { method: "DELETE" });
    if (res.ok) {
      setEnergias((atual) => atual.filter((e) => e.id !== energia.id));
    } else {
      setErro("Não foi possível apagar. Tente novamente.");
    }
  }

  return (
    <>
      {!aberto ? (
        <button type="button" className="button button--coral button--small admin-energia__abrir" onClick={() => setAberto(true)}>
          <span aria-hidden="true">+</span> Nova leitura
        </button>
      ) : (
        <form className="admin-preform" onSubmit={criar}>
          <h2 className="admin-builder__subtitulo">Nova leitura</h2>
          <div className="admin-preform__grade">
            <label className="admin-preform__largo">
              <span>Nome completo</span>
              <input
                type="text"
                required
                autoFocus
                value={form.consulenteNome}
                onChange={(e) => mudar("consulenteNome", e.target.value)}
                placeholder="Nome que será lido"
              />
            </label>
            <label>
              <span>Telefone</span>
              <input
                type="text"
                value={form.telefone}
                onChange={(e) => mudar("telefone", e.target.value)}
                placeholder="16 99999-9999"
              />
            </label>
            <label>
              <span>Instagram</span>
              <input
                type="text"
                value={form.instagram}
                onChange={(e) => mudar("instagram", e.target.value)}
                placeholder="@usuario"
              />
            </label>
            <label>
              <span>Data de nascimento</span>
              <input type="date" value={form.dataNascimento} onChange={(e) => mudar("dataNascimento", e.target.value)} />
            </label>
            <label>
              <span>Data agendada</span>
              <input type="date" value={form.dataAgendada} onChange={(e) => mudar("dataAgendada", e.target.value)} />
            </label>
            <label>
              <span>Veio por onde</span>
              <input
                type="text"
                list="admin-clientes-canais"
                value={form.veioPorOnde}
                onChange={(e) => mudar("veioPorOnde", e.target.value)}
                placeholder="Indicação, Instagram..."
              />
            </label>
            <label>
              <span>Quem indicou</span>
              <input
                type="text"
                value={form.quemIndicou}
                onChange={(e) => mudar("quemIndicou", e.target.value)}
                placeholder="Nome de quem indicou"
              />
            </label>
            <label>
              <span>Valor da consulta</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.valorConsulta}
                onChange={(e) => mudar("valorConsulta", e.target.value)}
                placeholder="0"
              />
            </label>
            <label>
              <span>Pagamento</span>
              <select value={form.status} onChange={(e) => mudar("status", e.target.value)}>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
              </select>
            </label>
          </div>

          <p className="admin-momento-form__ajuda">
            Só o nome é obrigatório — o resto pode ser completado depois no dashboard.
          </p>

          <div className="admin-preform__acoes">
            <button type="submit" className="button button--coral button--small" disabled={criando}>
              {criando ? "Criando..." : "Criar leitura"}
            </button>
            <button
              type="button"
              className="button button--outline button--small"
              onClick={() => {
                setAberto(false);
                setForm(VAZIO);
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Sugestões de canal reaproveitadas do dashboard, para o mesmo valor não
          entrar aqui com uma grafia e lá com outra. */}
      <datalist id="admin-clientes-canais">
        <option value="WhatsApp" />
        <option value="Recorrente" />
        <option value="Indicação" />
        <option value="Presencial" />
        <option value="Instagram" />
      </datalist>

      {erro && <p className="admin-momento-form__erro admin-builder__erro">⚠ {erro}</p>}

      {carregando ? (
        <p className="admin__carregando">Carregando...</p>
      ) : energias.length === 0 ? (
        <p className="admin__vazio">Nenhuma leitura de energia vibracional ainda.</p>
      ) : (
        <ul className="admin__lista admin__lista--energia">
          {energias.map((e) => (
            <li key={e.id} className="admin__linha-com-acao">
              <a href={`/admin/energia/${e.id}`} className="admin__item">
                <span className={`admin__status admin__status--${e.status}`}>
                  {e.status === "publicada" ? "Publicada" : "Preparando"}
                </span>
                <span className="admin__nome">{e.consulenteNome}</span>
                <span className="admin__data">{new Date(e.criadaEm).toLocaleDateString("pt-BR")}</span>
              </a>
              <button
                type="button"
                className="admin__apagar"
                onClick={() => remover(e)}
                aria-label={`Apagar leitura de ${e.consulenteNome}`}
                title="Apagar"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
