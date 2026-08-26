"use client";

import { useEffect, useRef, useState } from "react";

type Retangulo = { x: number; y: number; w: number; h: number };
type Corner = "nw" | "ne" | "sw" | "se";
type Arraste = { modo: "mover" | Corner; inicioX: number; inicioY: number; retanguloInicial: Retangulo };

const TAMANHO_MINIMO = 32;

function limitar(valor: number, min: number, max: number) {
  return Math.min(Math.max(valor, min), max);
}

// Ajusta o retângulo de corte a partir de um arraste, movendo só as bordas
// que aquele "canto" controla (nw mexe topo+esquerda, se mexe base+direita...).
function redimensionar(corner: Corner, dx: number, dy: number, inicial: Retangulo, canvasW: number, canvasH: number): Retangulo {
  let { x, y, w, h } = inicial;
  if (corner.includes("n")) {
    const novoY = limitar(inicial.y + dy, 0, inicial.y + inicial.h - TAMANHO_MINIMO);
    h = inicial.h - (novoY - inicial.y);
    y = novoY;
  }
  if (corner.includes("s")) {
    h = limitar(inicial.h + dy, TAMANHO_MINIMO, canvasH - inicial.y);
  }
  if (corner.includes("w")) {
    const novoX = limitar(inicial.x + dx, 0, inicial.x + inicial.w - TAMANHO_MINIMO);
    w = inicial.w - (novoX - inicial.x);
    x = novoX;
  }
  if (corner.includes("e")) {
    w = limitar(inicial.w + dx, TAMANHO_MINIMO, canvasW - inicial.x);
  }
  return { x, y, w, h };
}

export default function FotoEditor({
  foto,
  onConfirmar,
  onCancelar,
}: {
  foto: File;
  onConfirmar: (arquivo: File) => void;
  onCancelar: () => void;
}) {
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [rotacao, setRotacao] = useState(0);
  const [tamanho, setTamanho] = useState({ largura: 300, altura: 300, escala: 1 });
  const [crop, setCrop] = useState<Retangulo>({ x: 0, y: 0, w: 300, h: 300 });
  const [arraste, setArraste] = useState<Arraste | null>(null);
  const [processando, setProcessando] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelado = false;
    createImageBitmap(foto).then((bmp) => {
      if (!cancelado) setBitmap(bmp);
    });
    return () => { cancelado = true; };
  }, [foto]);

  // Recalcula o tamanho de exibição (limitado à tela) e reseta o corte para a
  // imagem inteira sempre que a foto muda ou ela é girada — tentar preservar
  // o corte através de uma rotação de 90° só complicaria sem ganhar nada.
  useEffect(() => {
    if (!bitmap) return;
    const rotacionado = rotacao % 180 !== 0;
    const largoOriginal = rotacionado ? bitmap.height : bitmap.width;
    const altoOriginal = rotacionado ? bitmap.width : bitmap.height;
    const maxLado = Math.min(360, (typeof window !== "undefined" ? window.innerWidth : 375) - 64);
    const escala = Math.min(1, maxLado / Math.max(largoOriginal, altoOriginal));
    const largura = Math.round(largoOriginal * escala);
    const altura = Math.round(altoOriginal * escala);
    setTamanho({ largura, altura, escala });
    setCrop({ x: 0, y: 0, w: largura, h: altura });
  }, [bitmap, rotacao]);

  // Desenha a imagem já girada dentro do canvas de pré-visualização.
  useEffect(() => {
    if (!bitmap) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotacao * Math.PI) / 180);
    const largoDesenho = bitmap.width * tamanho.escala;
    const altoDesenho = bitmap.height * tamanho.escala;
    ctx.drawImage(bitmap, -largoDesenho / 2, -altoDesenho / 2, largoDesenho, altoDesenho);
    ctx.restore();
  }, [bitmap, rotacao, tamanho]);

  useEffect(() => {
    if (!arraste) return;

    function mover(event: PointerEvent) {
      if (!arraste) return;
      const dx = event.clientX - arraste.inicioX;
      const dy = event.clientY - arraste.inicioY;
      if (arraste.modo === "mover") {
        const { x: xi, y: yi, w, h } = arraste.retanguloInicial;
        setCrop({
          x: limitar(xi + dx, 0, tamanho.largura - w),
          y: limitar(yi + dy, 0, tamanho.altura - h),
          w,
          h,
        });
      } else {
        setCrop(redimensionar(arraste.modo, dx, dy, arraste.retanguloInicial, tamanho.largura, tamanho.altura));
      }
    }
    function soltar() {
      setArraste(null);
    }
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arraste]);

  function iniciarArraste(modo: Arraste["modo"]) {
    return (event: React.PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setArraste({ modo, inicioX: event.clientX, inicioY: event.clientY, retanguloInicial: crop });
    };
  }

  async function confirmar() {
    if (!bitmap) return;
    setProcessando(true);
    try {
      const rotacionado = rotacao % 180 !== 0;
      const largoRotacionado = rotacionado ? bitmap.height : bitmap.width;
      const altoRotacionado = rotacionado ? bitmap.width : bitmap.height;

      // Refaz a rotação em resolução cheia (o canvas de pré-visualização é
      // menor, só para caber na tela) para não perder qualidade ao cortar.
      const cheio = document.createElement("canvas");
      cheio.width = largoRotacionado;
      cheio.height = altoRotacionado;
      const ctxCheio = cheio.getContext("2d");
      if (!ctxCheio) return;
      ctxCheio.save();
      ctxCheio.translate(largoRotacionado / 2, altoRotacionado / 2);
      ctxCheio.rotate((rotacao * Math.PI) / 180);
      ctxCheio.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
      ctxCheio.restore();

      const escalaInversa = tamanho.escala > 0 ? 1 / tamanho.escala : 1;
      const sx = crop.x * escalaInversa;
      const sy = crop.y * escalaInversa;
      const sw = crop.w * escalaInversa;
      const sh = crop.h * escalaInversa;

      const saida = document.createElement("canvas");
      saida.width = Math.max(1, Math.round(sw));
      saida.height = Math.max(1, Math.round(sh));
      const ctxSaida = saida.getContext("2d");
      if (!ctxSaida) return;
      ctxSaida.drawImage(cheio, sx, sy, sw, sh, 0, 0, saida.width, saida.height);

      const blob = await new Promise<Blob | null>((resolve) => saida.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) return;
      const nome = foto.name.replace(/\.\w+$/, "") + "-editada.jpg";
      onConfirmar(new File([blob], nome, { type: "image/jpeg" }));
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div className="foto-editor">
      <div className="foto-editor__painel">
        <p className="foto-editor__titulo">Ajustar foto</p>
        {!bitmap ? (
          <p className="admin__carregando">Carregando...</p>
        ) : (
          <div ref={stageRef} className="foto-editor__stage" style={{ width: tamanho.largura, height: tamanho.altura }}>
            <canvas ref={canvasRef} width={tamanho.largura} height={tamanho.altura} />
            <div
              className="foto-editor__crop"
              style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h }}
              onPointerDown={iniciarArraste("mover")}
            >
              <span className="foto-editor__handle foto-editor__handle--nw" onPointerDown={iniciarArraste("nw")} />
              <span className="foto-editor__handle foto-editor__handle--ne" onPointerDown={iniciarArraste("ne")} />
              <span className="foto-editor__handle foto-editor__handle--sw" onPointerDown={iniciarArraste("sw")} />
              <span className="foto-editor__handle foto-editor__handle--se" onPointerDown={iniciarArraste("se")} />
            </div>
          </div>
        )}
        <div className="foto-editor__acoes">
          <button type="button" className="button button--outline button--small" onClick={() => setRotacao((r) => (r + 90) % 360)} disabled={!bitmap}>
            ⟳ Girar
          </button>
          <button type="button" className="button button--outline button--small" onClick={onCancelar} disabled={processando}>
            Cancelar
          </button>
          <button type="button" className="button button--coral button--small" onClick={confirmar} disabled={!bitmap || processando}>
            {processando ? "Aplicando..." : "Usar foto"}
          </button>
        </div>
      </div>
    </div>
  );
}
