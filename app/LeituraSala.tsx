"use client";

import { useState } from "react";

type Foto = { id: string; ordem: number; r2Key: string };
type Audio = { id: string; ordem: number; r2Key: string };
type Momento = {
  id: string;
  ordem: number;
  titulo: string | null;
  resumo: string | null;
  pontosChave: string | null;
  fotos: Foto[];
  audios: Audio[];
};

export default function LeituraSala({
  consulenteNome,
  momentos,
}: {
  consulenteNome: string;
  momentos: Momento[];
}) {
  const [fotoAberta, setFotoAberta] = useState<string | null>(null);

  // Salva uma cópia funcional da página, não só o texto: um <base> na cópia faz
  // toda URL relativa (fotos, áudios, folha de estilo) resolver de volta pro
  // site, então o arquivo abre com o mesmo visual e mídia tocando — só falha
  // se ela abrir sem internet nenhuma, o que é uma limitação razoável.
  function baixarPagina() {
    const clone = document.documentElement.cloneNode(true) as HTMLElement;
    const head = clone.querySelector("head");
    if (head) {
      const base = document.createElement("base");
      base.href = `${window.location.origin}/`;
      head.insertBefore(base, head.firstChild);
    }
    clone.querySelector(".leitura-sala__baixar")?.remove();

    const html = `<!DOCTYPE html>\n${clone.outerHTML}`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leitura-${consulenteNome.split(" ")[0].toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <p className="leitura-sala__boasvindas">
        Obrigada por confiar a mim esse momento tão seu. Preparei cada carta com cuidado, e que esta
        leitura te acompanhe com verdade e traga mais clareza para os passos que ainda estão por vir.
        <span>Com carinho, Van</span>
      </p>

      <ol className="leitura-momentos">
        {momentos.map((momento, index) => (
          <li key={momento.id} className="leitura-momento">
            <span className="leitura-momento__numero">
              Momento {index + 1} de {momentos.length}
            </span>
            {momento.titulo && <h2>{momento.titulo}</h2>}
            {momento.resumo && <p className="leitura-momento__isca">{momento.resumo}</p>}
            {momento.fotos.length > 0 && (
              <div className="leitura-momento__fotos">
                {momento.fotos.map((foto) => (
                  <button
                    key={foto.id}
                    type="button"
                    className="leitura-momento__foto-zoom"
                    onClick={() => setFotoAberta(`/midia/${foto.r2Key}`)}
                    aria-label="Ampliar carta"
                  >
                    <img src={`/midia/${foto.r2Key}`} alt="Cartas reveladas na leitura" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
            {momento.audios.length > 0 && (
              <div className="leitura-momento__audios">
                {momento.audios.map((audio) => (
                  <audio key={audio.id} controls preload="none" src={`/midia/${audio.r2Key}`} />
                ))}
              </div>
            )}
            {momento.pontosChave && (
              <div className="leitura-momento__pontos">
                <p className="leitura-momento__pontos-rotulo">Pontos-chave deste momento</p>
                <p className="leitura-momento__pontos-texto">{momento.pontosChave}</p>
              </div>
            )}
          </li>
        ))}
      </ol>

      <button type="button" className="button button--outline leitura-sala__baixar" onClick={baixarPagina}>
        ⭳ Baixar esta leitura
      </button>

      {fotoAberta && (
        <div className="leitura-lightbox" role="button" tabIndex={0} onClick={() => setFotoAberta(null)} aria-label="Fechar ampliação">
          <img src={fotoAberta} alt="Carta ampliada" />
          <button
            type="button"
            className="leitura-lightbox__fechar"
            aria-label="Fechar"
            onClick={(e) => {
              e.stopPropagation();
              setFotoAberta(null);
            }}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
