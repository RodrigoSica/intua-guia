"use client";

import { useEffect, useState } from "react";

type Energia = {
  id: string;
  consulenteNome: string;
  status: string;
  criadaEm: string;
};

export default function AdminEnergiaLista() {
  const [energias, setEnergias] = useState<Energia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [nome, setNome] = useState("");
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

  async function criar(event: React.FormEvent) {
    event.preventDefault();
    const consulenteNome = nome.trim();
    if (!consulenteNome) return;

    setCriando(true);
    setErro("");
    try {
      const res = await fetch("/api/admin/energias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consulenteNome }),
      });
      const data = (await res.json()) as { id?: string; error?: string };

      if (!res.ok || !data.id) {
        setErro(data.error ?? "Não foi possível criar. Tente novamente.");
        return;
      }
      // Vai direto para o documento recém-criado: os blocos do nome já foram
      // montados a partir do nome digitado, então o próximo passo dela é
      // preencher, não escolher na lista.
      window.location.href = `/admin/energia/${data.id}`;
    } catch {
      setErro("Não foi possível criar. Verifique sua conexão.");
    } finally {
      setCriando(false);
    }
  }

  return (
    <>
      <form className="admin-clientes__novo" onSubmit={criar}>
        <input
          type="text"
          placeholder="Nome completo da pessoa"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <button type="submit" className="button button--coral button--small" disabled={criando}>
          <span aria-hidden="true">+</span> {criando ? "Criando..." : "Nova leitura"}
        </button>
      </form>
      {erro && <p className="admin-momento-form__erro admin-builder__erro">⚠ {erro}</p>}

      {carregando ? (
        <p className="admin__carregando">Carregando...</p>
      ) : energias.length === 0 ? (
        <p className="admin__vazio">Nenhuma leitura de energia vibracional ainda.</p>
      ) : (
        <ul className="admin__lista admin__lista--energia">
          {energias.map((e) => (
            <li key={e.id}>
              <a href={`/admin/energia/${e.id}`} className="admin__item">
                <span className={`admin__status admin__status--${e.status}`}>
                  {e.status === "publicada" ? "Publicada" : "Preparando"}
                </span>
                <span className="admin__nome">{e.consulenteNome}</span>
                <span className="admin__data">{new Date(e.criadaEm).toLocaleDateString("pt-BR")}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
