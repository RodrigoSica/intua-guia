"use client";

import { useEffect, useRef, useState } from "react";
import autoconhecimentoSvg from "./benefit-icons/autoconhecimento.svg?raw";
import clarezaSvg from "./benefit-icons/clareza.svg?raw";
import expansaoSvg from "./benefit-icons/expansao.svg?raw";
import padroesSvg from "./benefit-icons/padroes.svg?raw";
import protagonismoSvg from "./benefit-icons/protagonismo.svg?raw";
import superacaoSvg from "./benefit-icons/superacao.svg?raw";

type Benefit = {
  icon: string;
  title: string;
  text: string;
};

const rawIcons = {
  autoconhecimento: autoconhecimentoSvg,
  clareza: clarezaSvg,
  expansao: expansaoSvg,
  padroes: padroesSvg,
  protagonismo: protagonismoSvg,
  superacao: superacaoSvg,
};

type IconName = keyof typeof rawIcons;

function prepareSvg(svg: string) {
  return svg
    .replace(/<\?xml[\s\S]*?\?>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/\s(?:id|data-name)="[^"]*"/g, "")
    .replace("<svg ", '<svg aria-hidden="true" focusable="false" ');
}

const inlineIcons = Object.fromEntries(
  Object.entries(rawIcons).map(([name, svg]) => [name, prepareSvg(svg)]),
) as Record<IconName, string>;

function getIconName(path: string): IconName {
  const name = path.split("/").pop()?.replace(".svg", "") ?? "clareza";
  return name in inlineIcons ? (name as IconName) : "clareza";
}

export default function BenefitsGrid({ benefits }: { benefits: Benefit[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const hoverQuery = useRef<MediaQueryList | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    hoverQuery.current = media;

    const syncInteraction = () => {
      setActiveIndex(media.matches ? null : 0);
    };

    syncInteraction();
    media.addEventListener("change", syncInteraction);
    return () => media.removeEventListener("change", syncInteraction);
  }, []);

  const supportsHover = () => hoverQuery.current?.matches ?? false;

  return (
    <div className="benefit-grid">
      {benefits.map((benefit, index) => {
        const iconName = getIconName(benefit.icon);
        const isOpen = activeIndex === index;
        const panelId = `benefit-description-${index}`;

        return (
          <div
            className={`benefit-card ${isOpen ? "is-open" : ""}`}
            key={benefit.title}
            onMouseEnter={() => supportsHover() && setActiveIndex(index)}
            onMouseLeave={() => supportsHover() && setActiveIndex(null)}
            onFocus={() => supportsHover() && setActiveIndex(index)}
            onBlur={(event) => {
              if (
                supportsHover() &&
                !event.currentTarget.contains(event.relatedTarget as Node | null)
              ) {
                setActiveIndex(null);
              }
            }}
          >
            <button
              className="benefit-card__trigger"
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => {
                if (!supportsHover()) {
                  setActiveIndex((current) => current === index ? null : index);
                }
              }}
            >
              <span
                className={`benefit-card__icon benefit-card__icon--${iconName}`}
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: inlineIcons[iconName] }}
              />
              <h3>{benefit.title}</h3>
              <b aria-hidden="true">+</b>
            </button>
            <div
              className="benefit-card__reveal"
              id={panelId}
              aria-hidden={!isOpen}
            >
              <div className="benefit-card__reveal-inner">
                <p>{benefit.text}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
