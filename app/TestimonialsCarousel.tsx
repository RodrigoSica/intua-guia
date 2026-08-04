"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

type Testimonial = {
  highlight: string;
  quote: string;
  name: string;
  age: string;
  reading: string;
  initial: string;
};

export default function TestimonialsCarousel({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(3);
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const touchStart = useRef<number | null>(null);
  const pageCount = Math.ceil(testimonials.length / perPage);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px)");
    const update = () => {
      setPerPage(media.matches ? 1 : 3);
      setPage(0);
    };

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const goTo = (nextPage: number, nextDirection?: "next" | "previous") => {
    const normalized = (nextPage + pageCount) % pageCount;
    setDirection(nextDirection ?? (normalized > page ? "next" : "previous"));
    setPage(normalized);
  };

  const visible = testimonials.slice(page * perPage, page * perPage + perPage);

  return (
    <div
      className="testimonial-carousel"
      role="region"
      aria-roledescription="carrossel"
      aria-label="Depoimentos de consulentes"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") goTo(page - 1, "previous");
        if (event.key === "ArrowRight") goTo(page + 1, "next");
      }}
      onTouchStart={(event) => {
        touchStart.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const distance = event.changedTouches[0].clientX - touchStart.current;
        touchStart.current = null;
        if (Math.abs(distance) < 45) return;
        goTo(page + (distance < 0 ? 1 : -1), distance < 0 ? "next" : "previous");
      }}
    >
      <div className="testimonial-layout">
        <button
          className="carousel-arrow carousel-arrow--previous"
          type="button"
          aria-label="Ver depoimentos anteriores"
          onClick={() => goTo(page - 1, "previous")}
        >
          <span aria-hidden="true">‹</span>
        </button>

        <div className="testimonial-viewport" aria-live="polite">
          <div
            className={`testimonial-grid testimonial-grid--${direction}`}
            key={`${perPage}-${page}`}
          >
            {visible.map((testimonial, index) => (
              <figure
                className="testimonial"
                key={`${testimonial.name}-${testimonial.age}-${testimonial.reading}`}
                style={{ "--testimonial-index": index } as CSSProperties}
              >
                <span className="testimonial__mark" aria-hidden="true">“</span>
                <p className="testimonial__highlight">{testimonial.highlight}</p>
                <blockquote>{testimonial.quote}</blockquote>
                <figcaption>
                  <span className="avatar" aria-hidden="true">{testimonial.initial}</span>
                  <span>
                    <strong>{testimonial.name}, {testimonial.age}</strong>
                    <small>{testimonial.reading}</small>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        <button
          className="carousel-arrow carousel-arrow--next"
          type="button"
          aria-label="Ver próximos depoimentos"
          onClick={() => goTo(page + 1, "next")}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <div className="carousel-footer">
        <span className="carousel-counter" aria-hidden="true">
          {String(page + 1).padStart(2, "0")}
          <i />
          {String(pageCount).padStart(2, "0")}
        </span>
        <div className="carousel-dots" aria-label="Escolher grupo de depoimentos">
          {Array.from({ length: pageCount }, (_, index) => (
            <button
              className={index === page ? "is-active" : ""}
              key={index}
              type="button"
              aria-label={`Ir para o grupo ${index + 1}`}
              aria-current={index === page ? "true" : undefined}
              onClick={() => goTo(index)}
            >
              <span />
            </button>
          ))}
        </div>
        <span className="carousel-swipe-hint">Deslize para explorar</span>
      </div>
    </div>
  );
}
