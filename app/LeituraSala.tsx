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

function blobParaDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export default function LeituraSala({
  consulenteNome,
  momentos,
}: {
  consulenteNome: string;
  momentos: Momento[];
}) {
  const [fotoAberta, setFotoAberta] = useState<string | null>(null);
  const [baixando, setBaixando] = useState(false);

  // A leitura pode ser apagada do servidor no futuro (pra liberar espaço), e a
  // consulente pode reabrir isso sem internet nenhuma — então o arquivo salvo
  // não pode DEPENDER do site continuar no ar. Em vez de um <base> apontando
  // de volta pro servidor, cada foto e áudio vira base64 embutido no próprio
  // HTML: o arquivo carrega sozinho, sempre, com ou sem conexão.
  async function baixarPagina() {
    setBaixando(true);
    try {
      const clone = document.documentElement.cloneNode(true) as HTMLElement;
      clone.querySelector(".leitura-sala__baixar")?.remove();

      // A folha de estilo do próprio site também some se ela abrir offline —
      // embute o CSS como <style> em vez de deixar como <link> externo.
      const folhas = Array.from(clone.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
      for (const folha of folhas) {
        const href = folha.getAttribute("href");
        if (!href) continue;
        try {
          const css = await (await fetch(href)).text();
          const estilo = document.createElement("style");
          estilo.textContent = css;
          folha.replaceWith(estilo);
        } catch {
          // Se falhar (ex: fonte do Google, que exige internet de qualquer
          // forma), deixa o <link> como estava — degrada pra fonte padrão,
          // mas não trava o download.
        }
      }

      // Fotos e áudios: busca o arquivo real do R2 e embute como data URI.
      const midias = Array.from(clone.querySelectorAll<HTMLElement>("img[src^='/midia/'], audio[src^='/midia/']"));
      for (const midia of midias) {
        const src = midia.getAttribute("src");
        if (!src) continue;
        try {
          const blob = await (await fetch(src)).blob();
          midia.setAttribute("src", await blobParaDataUrl(blob));
        } catch {
          // Uma mídia que falhar não deve travar o download das outras.
        }
      }

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
    } finally {
      setBaixando(false);
    }
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

      <button
        type="button"
        className="button button--outline leitura-sala__baixar"
        onClick={baixarPagina}
        disabled={baixando}
      >
        {baixando ? "Preparando arquivo..." : "⭳ Baixar esta leitura"}
      </button>
      {baixando && (
        <p className="leitura-sala__baixar-aviso">
          Baixando fotos e áudios para dentro do arquivo — pode levar alguns segundos.
        </p>
      )}

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
