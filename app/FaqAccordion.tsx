"use client";

import { useState } from "react";

type Faq = { question: string; answer: string };

export default function FaqAccordion({ questions }: { questions: Faq[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="faq__list">
      {questions.map(({ question, answer }, index) => {
        const isOpen = openIndex === index;
        const answerId = `faq-answer-${index}`;

        return (
          <article className={`faq-item ${isOpen ? "is-open" : ""}`} key={question}>
            <button
              className="faq-question"
              type="button"
              aria-expanded={isOpen}
              aria-controls={answerId}
              onClick={() => setOpenIndex((current) => current === index ? null : index)}
            >
              <span className="faq-question__number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="faq-question__text">{question}</span>
              <span className="faq-question__icon" aria-hidden="true">
                <i />
                <i />
              </span>
            </button>
            <div className="faq-answer" id={answerId} aria-hidden={!isOpen}>
              <div className="faq-answer__inner">
                <p>{answer}</p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
