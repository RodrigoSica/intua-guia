"use client";

import { useState } from "react";

type Leitura = {
  id: string;
  consulenteNome: string;
  tipoLeitura: string;
  status: string;
  criadaEm: string;
};

export default function AdminLeiturasLista({ iniciais }: { iniciais: Leitura[] }) {
  const [leituras, setLeituras] = useState(iniciais);
  const [erro, setErro] = useState("");

  async function remover(leitura: Leitura) {
    if (
      !window.confirm(
        `Apagar a leitura de ${leitura.consulenteNome}?\n\nOs áudios e as fotos são apagados junto, o link enviado para ela para de funcionar e o atendimento sai do dashboard. Não tem como desfazer.`
      )
    ) {
      return;
    }

    const res = await fetch(`/api/admin/leituras/${leitura.id}`, { method: "DELETE" });
    if (res.ok) {
      setLeituras((atual) => atual.filter((l) => l.id !== leitura.id));
    } else {
      setErro("Não foi possível apagar. Tente novamente.");
    }
  }

  if (leituras.length === 0) {
    return (
      <p className="admin__vazio">
        Nenhum pedido ainda. Use o botão &ldquo;Solicitar leitura&rdquo; no dashboard.
      </p>
    );
  }

  return (
    <>
      {erro && <p className="admin-momento-form__erro admin-builder__erro">⚠ {erro}</p>}
      <ul className="admin__lista">
        {leituras.map((leitura) => (
          <li key={leitura.id} className="admin__linha-com-acao">
            <a href={`/admin/leitura/${leitura.id}`} className="admin__item">
              <span className={`admin__status admin__status--${leitura.status}`}>
                {leitura.status === "publicada" ? "Publicada" : "Preparando"}
              </span>
              <span className="admin__nome">{leitura.consulenteNome}</span>
              <span className="admin__tipo">{leitura.tipoLeitura}</span>
              <span className="admin__data">{new Date(leitura.criadaEm).toLocaleDateString("pt-BR")}</span>
            </a>
            <button
              type="button"
              className="admin__apagar"
              onClick={() => remover(leitura)}
              aria-label={`Apagar leitura de ${leitura.consulenteNome}`}
              title="Apagar"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
