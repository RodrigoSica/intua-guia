"use client";

import { useState } from "react";

function blobParaDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result as string);
    leitor.onerror = () => reject(leitor.error);
    leitor.readAsDataURL(blob);
  });
}

export default function EnergiaDownloadButton({ consulenteNome }: { consulenteNome: string }) {
  const [baixando, setBaixando] = useState(false);

  async function baixar() {
    setBaixando(true);
    try {
      const clone = document.documentElement.cloneNode(true) as HTMLElement;
      clone.querySelector(".energia__baixar")?.remove();
      const folhas = Array.from(clone.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
      for (const folha of folhas) {
        const href = folha.getAttribute("href");
        if (!href) continue;
        try {
          const estilo = document.createElement("style");
          estilo.textContent = await (await fetch(href)).text();
          folha.replaceWith(estilo);
        } catch {
          // Sem CSS local, o HTML ainda segue disponível com a fonte padrão.
        }
      }
      const midias = Array.from(clone.querySelectorAll<HTMLElement>("audio[src^='/midia/'], img[src^='/midia/']"));
      for (const midia of midias) {
        const src = midia.getAttribute("src");
        if (!src) continue;
        try {
          midia.setAttribute("src", await blobParaDataUrl(await (await fetch(src)).blob()));
        } catch {
          // Uma única mídia indisponível não impede o restante do arquivo.
        }
      }
      const arquivo = new Blob([`<!DOCTYPE html>\n${clone.outerHTML}`], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(arquivo);
      const link = document.createElement("a");
      link.href = url;
      link.download = `energia-vibracional-${consulenteNome.split(" ")[0].toLowerCase()}.html`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBaixando(false);
    }
  }

  return (
    <button type="button" className="button button--outline energia__baixar" onClick={baixar} disabled={baixando}>
      {baixando ? "Preparando arquivo..." : "⭳ Baixar esta leitura"}
    </button>
  );
}
