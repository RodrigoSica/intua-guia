"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

type Reading = {
  name: string;
  eyebrow: string;
  short: string;
  description: string;
  artwork: string;
  icon: string;
  highlights: { icon: string; label: string; text: string }[];
  points: string[];
};

const readings: Reading[] = [
  {
    name: "Se Desvendando",
    eyebrow: "Escuta e profundidade",
    short: "Uma leitura para reconhecer emoções, padrões e mensagens internas.",
    description: "Um convite para se observar com gentileza. A leitura ilumina camadas que pedem escuta e abre espaço para uma relação mais intuitiva consigo.",
    artwork: "/reading-cards/se-desvendando.webp",
    icon: "/reading-icons/se-desvendando.svg",
    highlights: [
      { icon: "☾", label: "Foco", text: "Mundo interno" },
      { icon: "◇", label: "Olhar", text: "Padrões emocionais" },
      { icon: "✦", label: "Entrega", text: "Integração" },
    ],
    points: ["Emoções ocultas", "Padrões recorrentes", "Cuidado e integração"],
  },
  {
    name: "Círculo de Afetos",
    eyebrow: "Afetos em perspectiva",
    short: "Compreenda vínculos, movimentos emocionais e possibilidades no amor.",
    description: "Um olhar profundo para o campo afetivo. A leitura organiza sentimentos e ajuda você a reconhecer escolhas mais coerentes com o amor que deseja viver.",
    artwork: "/reading-cards/circulo-de-afetos.webp",
    icon: "/reading-icons/circulo-de-afetos.svg",
    highlights: [
      { icon: "♡", label: "Foco", text: "Vida afetiva" },
      { icon: "☾", label: "Olhar", text: "Emoções e vínculos" },
      { icon: "∞", label: "Entrega", text: "Caminhos possíveis" },
    ],
    points: ["Dinâmica da relação", "Desejos e bloqueios", "Possibilidades futuras"],
  },
  {
    name: "Caminhos e Desafios",
    eyebrow: "Clareza para atravessar",
    short: "Ilumine escolhas, desafios e os próximos caminhos do seu ciclo.",
    description: "Para momentos de dúvida ou reposicionamento. O tarot ajuda a enxergar tensões, oportunidades e direções possíveis para seguir com mais consciência.",
    artwork: "/reading-cards/caminhos-e-desafios.webp",
    icon: "/reading-icons/caminhos-e-desafios.svg",
    highlights: [
      { icon: "↟", label: "Foco", text: "Escolhas e travessias" },
      { icon: "◇", label: "Olhar", text: "Desafios do ciclo" },
      { icon: "→", label: "Entrega", text: "Direção consciente" },
    ],
    points: ["Caminho atual", "Desafios do ciclo", "Próximo passo possível"],
  },
  {
    name: "Equilíbrio Energético",
    eyebrow: "Corpo, campo e presença",
    short: "Observe o que pede harmonização para que sua energia volte a circular.",
    description: "Uma leitura sensível para perceber excessos, faltas e pontos de atenção no seu campo energético, fortalecendo uma presença mais alinhada.",
    artwork: "/reading-cards/equilibrio-energetico.webp",
    icon: "/reading-icons/equilibrio-energetico.svg",
    highlights: [
      { icon: "◌", label: "Foco", text: "Campo energético" },
      { icon: "✧", label: "Olhar", text: "Centros de força" },
      { icon: "≈", label: "Entrega", text: "Harmonização" },
    ],
    points: ["Energia disponível", "Pontos de equilíbrio", "Prática de cuidado"],
  },
  {
    name: "Duas Perguntas",
    eyebrow: "Duas respostas essenciais",
    short: "Traga duas questões e encontre clareza para o momento que você vive.",
    description: "Uma leitura objetiva para questões que pedem direção. Cada pergunta é observada com presença, contexto e uma mensagem prática do tarot.",
    artwork: "/reading-cards/duas-perguntas.webp",
    icon: "/reading-icons/duas-perguntas.svg",
    highlights: [
      { icon: "?", label: "Foco", text: "Duas questões" },
      { icon: "☾", label: "Olhar", text: "Contexto presente" },
      { icon: "✦", label: "Entrega", text: "Clareza prática" },
    ],
    points: ["O coração da questão", "Caminho de cada pergunta", "Mensagem para agir"],
  },
  {
    name: "Mandala Astrológica",
    eyebrow: "Leitura completa",
    short: "Um panorama profundo do seu ciclo, das raízes às possibilidades futuras.",
    description: "Uma leitura ampla para quem deseja se escutar por inteiro. A Mandala conecta diferentes áreas da vida e revela como passado, presente e potência se encontram.",
    artwork: "/reading-cards/mandala-astrologica.webp",
    icon: "/reading-icons/mandala-astrologica.svg",
    highlights: [
      { icon: "☼", label: "Foco", text: "Ciclo completo" },
      { icon: "◎", label: "Olhar", text: "Áreas da vida" },
      { icon: "✦", label: "Entrega", text: "Síntese profunda" },
    ],
    points: ["Raízes e aprendizados", "Cenário atual", "Potências do novo ciclo"],
  },
  {
    name: "Tiragem Cigana",
    eyebrow: "Símbolos em movimento",
    short: "Uma leitura direta para iluminar o momento presente e seus próximos caminhos.",
    description: "A linguagem do baralho cigano organiza sinais, movimentos e possibilidades com objetividade e delicadeza para o seu momento atual.",
    artwork: "/reading-cards/tiragem-cigana.webp",
    icon: "/reading-icons/tiragem-cigana.svg",
    highlights: [
      { icon: "✦", label: "Foco", text: "Momento presente" },
      { icon: "⌁", label: "Olhar", text: "Sinais e movimentos" },
      { icon: "→", label: "Entrega", text: "Próxima direção" },
    ],
    points: ["Energia do momento", "Mensagem central", "Próximo passo possível"],
  },
];

type Phase = "browse" | "measure" | "opening" | "detail" | "closing";

// Abertura do leque dirigida pela rolagem (scroll-driven / scrubbing):
// o progresso vai de 0 (baralho empilhado, ao entrar na tela) a 1 (leque
// aberto, quando a seção centraliza). Cada carta soma seu --lag ao próprio
// início, e FAN_LAG_SPAN normaliza para que a última ainda chegue a 1.
const FAN_LAG_STEP = 0.07;
const FAN_LAG_SPAN = 1 - FAN_LAG_STEP * 3;
const FAN_COMPLETE_VIEWPORT_RATIO = 0.67;

type FlightSource = {
  index: number;
  fromX: number;
  fromY: number;
  fromW: number;
  fromH: number;
  fromRotation: number;
  fromScale: number;
};

type Flight = FlightSource & {
  midX: number;
  midY: number;
  midScale: number;
  toX: number;
  toY: number;
  toLocalX: number;
  toLocalY: number;
  toScale: number;
};

/** Rotação atual do elemento, em graus, extraída da matriz de transform. */
function lerRotacao(el: HTMLElement) {
  const { a, b } = new DOMMatrixReadOnly(getComputedStyle(el).transform);
  return (Math.atan2(b, a) * 180) / Math.PI;
}

function CardArtwork({ reading, side }: { reading: Reading; side: "front" | "back" }) {
  const src = side === "back" ? "/reading-cards/card-back.webp" : reading.artwork;
  return (
    <div className={`igu-card-face ${side === "back" ? "igu-card-back" : "igu-card-front"}`}>
      <img src={src} alt="" draggable={false} />
    </div>
  );
}

function StaticFrontCard({ reading, cardRef, hidden }: { reading: Reading; cardRef: React.RefObject<HTMLDivElement | null>; hidden: boolean }) {
  return (
    <div className={`igu-detail-card ${hidden ? "igu-detail-card--placeholder" : ""}`} ref={cardRef} aria-hidden="true">
      <CardArtwork reading={reading} side="front" />
    </div>
  );
}

export default function ReadingExperience() {
  const [phase, setPhase] = useState<Phase>("browse");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(2);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const detailCardRef = useRef<HTMLDivElement | null>(null);
  const experienceRef = useRef<HTMLElement | null>(null);
  const sourceRef = useRef<FlightSource | null>(null);
  // onFocus também seta activeIndex (equivalente de hover p/ teclado); sem
  // isto, devolver o foco à carta ao voltar do detalhe reacende o mesmo
  // destaque que acabamos de zerar. Suprime só essa única chamada programática.
  const suppressFocusHighlightRef = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(hover: none), (pointer: coarse)");
    const update = () => setCoarsePointer(media.matches || window.innerWidth < 760);
    update();
    media.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // A arte da frente (125-226KB cada) só entra no DOM quando a carta é
  // escolhida — sem isso o download começa no clique e a carta gira exibindo
  // a face preta até chegar. Aquece tudo em tempo ocioso, para não disputar
  // banda com o carregamento inicial da página.
  useEffect(() => {
    let cancelled = false;

    const warm = () => {
      if (cancelled) return;
      readings.forEach((reading) => {
        const img = new Image();
        img.src = reading.artwork;
        void img.decode?.().catch(() => {});
      });
    };

    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const scope = window as IdleWindow;
    const idle = scope.requestIdleCallback;
    const handle = idle ? idle(warm, { timeout: 2500 }) : window.setTimeout(warm, 1200);

    return () => {
      cancelled = true;
      if (idle && scope.cancelIdleCallback) scope.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, []);

  // Rede de segurança: se o clique vier antes do aquecimento ocioso terminar,
  // a carta sob o cursor/toque já sobe de prioridade.
  useEffect(() => {
    if (activeIndex === null) return;
    const img = new Image();
    img.setAttribute("fetchpriority", "high");
    img.src = readings[activeIndex].artwork;
  }, [activeIndex]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && phase === "detail") returnToDeck();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  // Scrubbing: --fan acompanha a travessia da seção pela viewport, de 0 quando
  // ela começa a entrar até 1 um pouco antes de o centro dela encontrar o
  // centro da tela, mantendo o leque aberto por mais tempo no enquadramento.
  // useLayoutEffect para o valor certo já valer no primeiro pintura, sem flash.
  useLayoutEffect(() => {
    const section = experienceRef.current;
    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      section.style.setProperty("--fan", "1");
      return;
    }

    const stage = section.querySelector<HTMLElement>(".igu-card-stage");
    let frame = 0;
    let settle = 0;
    let last = -1;

    const apply = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const viewport = window.innerHeight;
      const center = rect.top + rect.height / 2;
      const from = viewport + rect.height / 2;
      const to = viewport * FAN_COMPLETE_VIEWPORT_RATIO;
      const next = Math.min(1, Math.max(0, (from - center) / (from - to)));
      if (Math.abs(next - last) < 0.002) return;
      last = next;
      section.style.setProperty("--fan", next.toFixed(4));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
      // A transição de .45s existe para o hover; mantida durante a rolagem ela
      // faria o leque arrastar atrás do cursor de scroll.
      stage?.classList.add("is-scrubbing");
      window.clearTimeout(settle);
      settle = window.setTimeout(() => stage?.classList.remove("is-scrubbing"), 140);
    };

    // Primeira aplicação sem transição: --fan sai do padrão 1 (do CSS) para o
    // valor real da rolagem, e com a transição ativa o leque abriria e
    // colapsaria à vista no carregamento. O reflow commita antes de religá-la.
    stage?.classList.add("is-scrubbing");
    apply();
    void section.offsetHeight;
    stage?.classList.remove("is-scrubbing");

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(settle);
    };
  }, []);

  useLayoutEffect(() => {
    if (phase !== "measure") return;
    const source = sourceRef.current;
    const landing = detailCardRef.current;
    const experience = experienceRef.current;
    if (!source || !landing || !experience) {
      sourceRef.current = null;
      setPhase("browse");
      return;
    }

    const targetRect = landing.getBoundingClientRect();
    const experienceRect = experience.getBoundingClientRect();
    const targetScale = targetRect.width / source.fromW;
    const middleScale = Math.max(source.fromScale, targetScale) * 1.045;
    const targetX = targetRect.left + targetRect.width / 2 - source.fromW / 2;
    const targetY = targetRect.top + targetRect.height / 2 - source.fromH / 2;
    const localX = targetRect.left - experienceRect.left + targetRect.width / 2 - source.fromW / 2;
    const localY = targetRect.top - experienceRect.top + targetRect.height / 2 - source.fromH / 2;

    setFlight({
      ...source,
      midX: window.innerWidth / 2 - source.fromW / 2,
      midY: Math.max(42, window.innerHeight * 0.42 - source.fromH / 2),
      midScale: middleScale,
      toX: targetX,
      toY: targetY,
      toLocalX: localX,
      toLocalY: localY,
      toScale: targetScale,
    });
    sourceRef.current = null;
    setPhase("opening");
  }, [phase, selectedIndex]);

  const positions = useMemo(() => readings.map((_, index) => {
    const slot = index - 3;
    const dist = Math.abs(slot);
    return {
      "--slot": slot,
      "--angle": `${slot * 5.4}deg`,
      "--curve": `${dist * dist * 10}px`,
      "--curve-mobile": `${dist * dist * 5.2}px`,
      "--z": 8 - dist,
      // Atraso escalonado: as cartas de fora começam a abrir depois das de
      // dentro, então o leque se desdobra em cascata em vez de em bloco.
      "--lag": (dist * FAN_LAG_STEP).toFixed(3),
    } as CSSProperties;
  }), []);

  function beginReveal(index: number) {
    const card = cardRefs.current[index];
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    sourceRef.current = {
      index,
      fromX: rect.left + rect.width / 2 - width / 2,
      fromY: rect.top + rect.height / 2 - height / 2,
      fromW: width,
      fromH: height,
      // Lê a rotação renderizada em vez de assumir a do leque desktop: no
      // mobile as cartas usam a cascata vertical, com ângulo diferente, e um
      // valor fixo faria a carta saltar no início do voo.
      fromRotation: lerRotacao(card),
      fromScale: window.innerWidth < 760 ? 1.06 : 1.035,
    };
    setSelectedIndex(index);
    setPhase("measure");
  }

  function chooseCard(index: number) {
    if (phase !== "browse") return;
    if (coarsePointer && activeIndex !== index) {
      setActiveIndex(index);
      return;
    }
    beginReveal(index);
  }

  function returnToDeck() {
    // O deck só reaparece de fato quando o fade de saída do detalhe termina
    // (ver onAnimationEnd em .igu-detail) — mesmo padrão em espelho da entrada.
    setPhase("closing");
  }

  function finishReturnToDeck() {
    setPhase("browse");
    // null, não selectedIndex: a cena 1 deve voltar ao repouso — nenhuma
    // carta "em destaque" — não à posição de hover/seleção anterior.
    setActiveIndex(null);
    setFlight(null);
    suppressFocusHighlightRef.current = true;
    window.setTimeout(() => cardRefs.current[selectedIndex]?.focus(), 80);
  }

  const selected = readings[selectedIndex];
  const active = activeIndex === null ? null : readings[activeIndex];
  const selectedBookingUrl = `https://wa.me/5511954591521?text=${encodeURIComponent(`Olá, gostaria de agendar a leitura ${selected.name} com a Intua Guia.`)}`;

  return (
    <section
      className={`igu-experience igu-phase-${phase}`}
      id="leituras"
      ref={experienceRef}
      style={{ "--fan-span": FAN_LAG_SPAN } as CSSProperties}
    >
      <div className="igu-grain" />
      <div className="igu-picker" aria-hidden={phase !== "browse"}>
        <div className="igu-deck-zone">
          <div className="igu-deck-halo" />
          <div className="igu-card-stage">
            {readings.map((reading, index) => (
              <button
                className={`igu-deck-card ${activeIndex === index ? "is-active" : ""} ${selectedIndex === index && phase === "opening" ? "is-departing" : ""}`}
                key={reading.name}
                style={positions[index]}
                ref={(node) => { cardRefs.current[index] = node; }}
                type="button"
                onMouseEnter={() => !coarsePointer && phase === "browse" && setActiveIndex(index)}
                onMouseLeave={() => !coarsePointer && phase === "browse" && setActiveIndex(null)}
                onFocus={() => {
                  if (suppressFocusHighlightRef.current) { suppressFocusHighlightRef.current = false; return; }
                  if (!coarsePointer && phase === "browse") setActiveIndex(index);
                }}
                onClick={() => chooseCard(index)}
                aria-label={`${reading.name}. ${reading.short}${coarsePointer && activeIndex !== index ? ". Toque para conhecer." : ". Abrir leitura."}`}
              >
                <CardArtwork reading={reading} side="back" />
              </button>
            ))}
          </div>
          <div className={`igu-reading-peek ${active ? "is-visible" : ""}`} aria-live="polite">
            {active && <img className="igu-reading-peek-icon" src={active.icon} alt="" aria-hidden="true" />}
            <p>{active?.eyebrow ?? "Tipos de Leitura"}</p>
            <h3>{active?.name ?? "Uma carta espera por você"}</h3>
            {active && <span>{active.short}</span>}
            {coarsePointer && active && <small>Toque novamente para revelar</small>}
          </div>
        </div>
        <p className="igu-hint"><span aria-hidden="true">{coarsePointer ? "◇" : "↖"}</span>{coarsePointer ? "Toque para sentir. Toque outra vez para revelar." : "Aproxime o cursor e escolha a sua leitura"}</p>
      </div>

      {flight && phase !== "browse" && (
        <div
          className={`igu-flight-card ${phase === "detail" || phase === "closing" ? "is-landed" : ""}`}
          style={{
            "--from-x": `${flight.fromX}px`, "--from-y": `${flight.fromY}px`, "--from-w": `${flight.fromW}px`, "--from-h": `${flight.fromH}px`,
            "--from-r": `${flight.fromRotation}deg`, "--from-scale": flight.fromScale, "--mid-x": `${flight.midX}px`, "--mid-y": `${flight.midY}px`,
            "--mid-scale": flight.midScale, "--to-x": `${flight.toX}px`, "--to-y": `${flight.toY}px`, "--to-local-x": `${flight.toLocalX}px`,
            "--to-local-y": `${flight.toLocalY}px`, "--to-scale": flight.toScale,
          } as CSSProperties}
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget && event.animationName === "igu-flight-path") setPhase("detail");
          }}
          aria-hidden="true"
        >
          <div className="igu-flight-card__inner">
            <CardArtwork reading={readings[flight.index]} side="back" />
            <CardArtwork reading={readings[flight.index]} side="front" />
          </div>
        </div>
      )}

      <section
        className="igu-detail"
        aria-hidden={phase !== "detail" && phase !== "closing"}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget && event.animationName === "igu-detail-leave") finishReturnToDeck();
        }}
      >
        <div className="igu-detail-layout">
          <div className="igu-detail-card-column">
            <div className="igu-detail-glow" />
            <StaticFrontCard reading={selected} cardRef={detailCardRef} hidden={flight !== null} />
            <p>Leitura {String(selectedIndex + 1).padStart(2, "0")}</p>
          </div>
          <div className="igu-detail-copy">
            <p className="igu-detail-kicker">{selected.eyebrow}</p>
            <h2>{selected.name}</h2>
            <p className="igu-description">{selected.description}</p>
            <div className="igu-highlight-grid">
              {selected.highlights.map((highlight) => <div className="igu-highlight" key={highlight.label}><i>{highlight.icon}</i><div><small>{highlight.label}</small><strong>{highlight.text}</strong></div></div>)}
            </div>
            <div className="igu-points"><p>Pontos trabalhados</p><ul>{selected.points.map((point) => <li key={point}><span>✦</span>{point}</li>)}</ul></div>
            <div className="igu-detail-actions">
              <a className="igu-cta" href={selectedBookingUrl} target="_blank" rel="noopener noreferrer">Agendar esta leitura <span>→</span></a>
              <button className="igu-back-button" type="button" onClick={returnToDeck}><span aria-hidden="true">←</span> Voltar às leituras</button>
            </div>
          </div>
        </div>
      </section>
      <div className={`igu-whisper ${phase === "opening" ? "is-visible" : ""}`}><span /> Revelando o seu caminho <span /></div>
    </section>
  );
}
