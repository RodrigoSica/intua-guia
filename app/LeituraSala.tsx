"use client";

import { useState } from "react";

type Foto = { id: string; ordem: number; r2Key: string };
type Audio = { id: string; ordem: number; r2Key: string };
type Momento = {
  id: string;
  ordem: number;
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
  const [baixado, setBaixado] = useState(false);
  const [erroBaixar, setErroBaixar] = useState("");
  const [compartilhando, setCompartilhando] = useState(false);
  const [erroCompartilhar, setErroCompartilhar] = useState("");

  const nomeArquivo = `leitura-${consulenteNome.split(" ")[0].toLowerCase()}.html`;

  // A leitura pode ser apagada do servidor no futuro (pra liberar espaço), e a
  // consulente pode reabrir isso sem internet nenhuma — então o arquivo salvo
  // não pode DEPENDER do site continuar no ar. Em vez de um <base> apontando
  // de volta pro servidor, cada foto e áudio vira base64 embutido no próprio
  // HTML: o arquivo carrega sozinho, sempre, com ou sem conexão.
  //
  // Usado tanto pelo botão de baixar quanto pelo de compartilhar — os dois
  // precisam do mesmo arquivo autocontido, só o destino final muda.
  //
  // Busca tudo (CSS + cada foto + cada áudio) em paralelo, não um de cada
  // vez: o navigator.share() só funciona se chamado logo depois do clique
  // (o Android considera que o usuário "autorizou" a ação por um tempo
  // curto). Com vários momentos, buscar sequencialmente podia levar
  // segundos e derrubar essa janela — daí o menu de compartilhar recusava
  // abrir com "não foi possível compartilhar", mesmo o arquivo estando ok.
  async function montarArquivoLeitura(): Promise<File> {
    const clone = document.documentElement.cloneNode(true) as HTMLElement;
    clone.querySelector(".leitura-sala__acoes")?.remove();

    // A folha de estilo do próprio site também some se ela abrir offline —
    // embute o CSS como <style> em vez de deixar como <link> externo.
    const folhas = Array.from(clone.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
    await Promise.all(
      folhas.map(async (folha) => {
        const href = folha.getAttribute("href");
        if (!href) return;
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
      })
    );

    // Fotos e áudios: busca o arquivo real do R2 e embute como data URI.
    const midias = Array.from(clone.querySelectorAll<HTMLElement>("img[src^='/midia/'], audio[src^='/midia/']"));
    await Promise.all(
      midias.map(async (midia) => {
        const src = midia.getAttribute("src");
        if (!src) return;
        try {
          const blob = await (await fetch(src)).blob();
          midia.setAttribute("src", await blobParaDataUrl(blob));
        } catch {
          // Uma mídia que falhar não deve travar o download das outras.
        }
      })
    );

    const html = `<!DOCTYPE html>\n${clone.outerHTML}`;
    return new File([html], nomeArquivo, { type: "text/html;charset=utf-8" });
  }

  function baixarArquivo(arquivo: File) {
    const url = URL.createObjectURL(arquivo);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function abrirWhatsAppComLink() {
    const mensagem = `Aqui está a sua leitura de tarot:\n${window.location.href}`;
    window.location.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
  }

  async function baixarPagina() {
    setBaixando(true);
    setBaixado(false);
    setErroBaixar("");
    try {
      const arquivo = await montarArquivoLeitura();
      baixarArquivo(arquivo);
      setBaixado(true);
    } catch {
      setErroBaixar(
        "Não foi possível preparar o arquivo agora. Tente de novo, ou me chame no WhatsApp que eu reenvio."
      );
    } finally {
      setBaixando(false);
    }
  }

  // Um site não consegue abrir o WhatsApp direto com um arquivo anexado —
  // isso não existe nem pro Instagram, nem pro Twitter, nem pra ninguém,
  // por segurança do próprio Android. O que dá pra fazer (e é o que todo
  // mundo faz) é abrir o menu de compartilhamento nativo do celular com o
  // arquivo pronto, e o WhatsApp aparece ali como uma das opções — a
  // consulente escolhe e ele já vai anexado, sem precisar salvar antes.
  async function compartilharPagina() {
    setCompartilhando(true);
    setErroCompartilhar("");

    // No celular, o fluxo mais confiável é abrir o WhatsApp com o link da
    // leitura. O compartilhamento de arquivos HTML pelo Web Share varia entre
    // fabricantes e gerava a mensagem de falha do anexo.
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      abrirWhatsAppComLink();
      setCompartilhando(false);
      return;
    }

    const arquivo = await montarArquivoLeitura().catch(() => null);
    if (!arquivo) {
      setErroCompartilhar("Não foi possível preparar o arquivo agora. Tente de novo.");
      setCompartilhando(false);
      return;
    }

    if (!navigator.canShare?.({ files: [arquivo] })) {
      // Navegador sem suporte a compartilhar arquivo (ex: computador) —
      // cai pro download normal, que ao menos sempre funciona.
      abrirWhatsAppComLink();
      setCompartilhando(false);
      return;
    }

    try {
      await navigator.share({
        files: [arquivo],
        title: "Sua leitura de tarot",
        text: "Aqui está a sua leitura ✨",
      });
    } catch (erro) {
      // A consulente cancelar o menu de compartilhamento (ex: apertou voltar)
      // não é erro de verdade — não baixa nada, não mostra aviso.
      const cancelou = erro instanceof Error && erro.name === "AbortError";
      if (!cancelou) {
        // Qualquer outra falha (ex: a preparação demorou demais e o Android
        // não deixou mais abrir o menu) — a consulente não pode ficar de mãos
        // vazias, então baixa o mesmo arquivo que já está pronto.
        abrirWhatsAppComLink();
      }
    } finally {
      setCompartilhando(false);
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
          </li>
        ))}
      </ol>

      <div className="leitura-sala__acoes">
        <button
          type="button"
          className="button button--coral leitura-sala__compartilhar"
          onClick={compartilharPagina}
          disabled={compartilhando}
        >
          {compartilhando ? "Abrindo WhatsApp..." : "💬 Compartilhar no WhatsApp"}
        </button>
        <button
          type="button"
          className="button button--outline leitura-sala__baixar"
          onClick={baixarPagina}
          disabled={baixando}
        >
          {baixando ? "Preparando arquivo..." : "⭳ Baixar esta leitura"}
        </button>
      </div>

      {(baixando || compartilhando) && (
        <p className="leitura-sala__baixar-aviso">
          Preparando fotos e áudios dentro do arquivo — pode levar alguns segundos.
        </p>
      )}
      {baixado && (
        <p className="leitura-sala__baixar-sucesso">
          ✓ Arquivo salvo! No seu celular, ele fica na pasta &ldquo;Download&rdquo; — procure pelo
          app &ldquo;Arquivos&rdquo; (ou &ldquo;Meus Arquivos&rdquo;) se não souber onde encontrar, ou
          veja o aviso de download que apareceu agora há pouco na tela.
        </p>
      )}
      {erroBaixar && <p className="admin-momento-form__erro">⚠ {erroBaixar}</p>}
      {erroCompartilhar && <p className="admin-momento-form__erro">⚠ {erroCompartilhar}</p>}

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
