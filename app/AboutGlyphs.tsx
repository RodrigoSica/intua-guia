"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

// Velocidades bem espalhadas de propósito — cada pictograma percorre uma
// distância própria, não uma fração previsível das outras. Sinais opostos
// fazem alguns subirem enquanto outros descem, criando profundidade em vez
// de um bloco deslizando junto. `float` desencontra as micro-animações para
// que nunca pulsem em uníssono.
const glyphs = [
  { name: "estrela", src: "/about-icons/estrela.svg", speed: 0.5, float: "7.5s", delay: "0s" },
  { name: "visao", src: "/about-icons/visao.svg", speed: -0.6, float: "9s", delay: "-2.2s" },
  { name: "vela", src: "/about-icons/vela.svg", speed: 0.42, float: "8.2s", delay: "-4.6s" },
  { name: "cristal", src: "/about-icons/cristal.svg", speed: -1.35, float: "10s", delay: "-1.4s" },
  { name: "maos", src: "/about-icons/maos.svg", speed: 0.78, float: "8.8s", delay: "-6.1s" },
];

export default function AboutGlyphs() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const items = Array.from(root.querySelectorAll<HTMLElement>(".about__glyph"));
    let frame = 0;

    const apply = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const viewport = window.innerHeight;
      // -1 quando o bloco está saindo por cima, +1 quando ainda vem chegando.
      const delta = (viewport / 2 - (rect.top + rect.height / 2)) / viewport;
      const clamped = Math.max(-1.2, Math.min(1.2, delta));
      for (const item of items) {
        const speed = Number(item.dataset.speed ?? 0);
        item.style.setProperty("--py", `${(clamped * speed * 130).toFixed(2)}px`);
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="about__aura" ref={rootRef} aria-hidden="true">
      {glyphs.map((glyph) => (
        <span
          key={glyph.name}
          className={`about__glyph about__glyph--${glyph.name}`}
          data-speed={glyph.speed}
          style={{ "--float": glyph.float, "--float-delay": glyph.delay } as CSSProperties}
        >
          <img src={glyph.src} alt="" draggable={false} />
        </span>
      ))}
    </div>
  );
}
