import BenefitsGrid from "./BenefitsGrid";
import FaqAccordion from "./FaqAccordion";
import TestimonialsCarousel from "./TestimonialsCarousel";

const WHATSAPP_BOOKING_URL = "https://wa.me/5511954591521?text=Ol%C3%A1%2C%20gostaria%20de%20agendar%20uma%20leitura%20com%20a%20Intua%20Guia.";

const benefits = [
  {
    icon: "/benefit-icons/clareza.svg",
    title: "Clareza para decisões",
    text: "Nos momentos de dúvida, o tarot organiza o que parece confuso. Enxergue com mais nitidez o que pede atenção agora e escolha o próximo passo com presença, sem se perder em mil possibilidades.",
  },
  {
    icon: "/benefit-icons/autoconhecimento.svg",
    title: "Autoconhecimento profundo",
    text: "Cada leitura é um espelho. Aprofunde sua compreensão sobre quem você é, o que te move e para onde seus propósitos apontam, reconectando-se com partes suas que andavam silenciadas.",
  },
  {
    icon: "/benefit-icons/superacao.svg",
    title: "Superação de obstáculos",
    text: "Identifique com honestidade os bloqueios que te seguram no mesmo lugar. A partir daí, encontramos juntas caminhos concretos para atravessar o que hoje parece intransponível.",
  },
  {
    icon: "/benefit-icons/protagonismo.svg",
    title: "Protagonismo na sua jornada",
    text: "Assuma o controle da sua própria história em vez de apenas reagir a ela. O tarot não decide por você — ele ilumina escolhas para que construa, com autoria, o futuro que deseja viver.",
  },
  {
    icon: "/benefit-icons/padroes.svg",
    title: "Identificação de padrões repetitivos",
    text: "Reconheça os ciclos emocionais e relacionais que insistem em se repetir e te impedem de evoluir. Ao trazer esses padrões à consciência, você ganha o poder de finalmente transformá-los.",
  },
  {
    icon: "/benefit-icons/expansao.svg",
    title: "Expansão da intuição",
    text: "Amplie sua visão para além do óbvio e treine a escuta da sua própria intuição. Descubra novas possibilidades para sua vida que a lógica sozinha ainda não tinha conseguido revelar.",
  },
];

const readings = [
  { name: "Se Desvendando", icon: "⌁" },
  { name: "Círculo de Afetos", icon: "♡" },
  { name: "Caminhos e Desafios", icon: "〰" },
  { name: "Equilíbrio Energético", icon: "✧" },
  { name: "Duas Perguntas", icon: "☾" },
  { name: "Mandala Astrológica", icon: "✺" },
  { name: "Tiragem Cigana", icon: "⌂" },
];

const testimonials = [
  {
    quote: "Nunca tinha feito uma tiragem tão acolhedora.",
    name: "Juliana",
    age: "28 anos",
    initial: "J",
  },
  {
    quote: "Foi como conversar com meu coração.",
    name: "Patrícia",
    age: "34 anos",
    initial: "P",
  },
  {
    quote: "Rápido, direto e profundo!",
    name: "Carla",
    age: "31 anos",
    initial: "C",
  },
  {
    quote: "A leitura organizou sentimentos que eu ainda não conseguia nomear.",
    name: "Renata",
    age: "39 anos",
    initial: "R",
  },
  {
    quote: "Saí com mais clareza e, principalmente, mais confiança em mim.",
    name: "Beatriz",
    age: "42 anos",
    initial: "B",
  },
  {
    quote: "Foi delicado, profundo e muito diferente de tudo que eu imaginava.",
    name: "Luana",
    age: "30 anos",
    initial: "L",
  },
  {
    quote: "Consegui enxergar um padrão que se repetia há anos na minha vida.",
    name: "Marina",
    age: "36 anos",
    initial: "M",
  },
  {
    quote: "Me senti acolhida em cada palavra, sem julgamentos e sem respostas prontas.",
    name: "Aline",
    age: "27 anos",
    initial: "A",
  },
  {
    quote: "A consulta trouxe direção sem tirar de mim a liberdade de escolher.",
    name: "Fernanda",
    age: "45 anos",
    initial: "F",
  },
];

const faqs = [
  "Como funciona a consulta de tarot?",
  "Como faço para agendar uma consulta?",
  "Preciso estar disponível no momento da consulta?",
  "O que preciso informar antes da leitura?",
  "É tudo sigiloso?",
  "As leituras são ao vivo ou gravadas?",
  "Quanto tempo dura cada consulta?",
  "Posso perguntar sobre qualquer área da minha vida?",
];

function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className={`brand ${light ? "brand--light" : ""}`}>
      <img src="/intua-guia-logo.svg" alt="Intua Guia" />
    </span>
  );
}

function SectionMark() {
  return <span className="section-mark" aria-hidden="true">✦</span>;
}

const HERO_WORD_START = 0.5;
const HERO_WORD_STEP = 0.085;

function HeroWords({ words, startIndex }: { words: string[]; startIndex: number }) {
  return words.map((word, i) => (
    <span key={startIndex + i}>
      <span
        className="hero-word"
        style={{ animationDelay: `${(HERO_WORD_START + (startIndex + i) * HERO_WORD_STEP).toFixed(3)}s` }}
      >
        {word}
      </span>{" "}
    </span>
  ));
}

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a href="#inicio" className="brand-link" aria-label="Voltar ao início">
          <Brand />
        </a>
        <nav aria-label="Navegação principal">
          <a href="#sobre">Sobre</a>
          <a href="#leituras">Leituras</a>
          <a href="#depoimentos">Depoimentos</a>
          <a href="#duvidas">FAQ</a>
          <a href="#contato">Contato</a>
        </nav>
        <a className="button button--coral button--small" href={WHATSAPP_BOOKING_URL} target="_blank" rel="noopener noreferrer">Agendar leitura</a>
      </header>

      <section className="hero" id="inicio">
        <div className="container hero__content">
          <div className="hero__grid">
            <div className="hero__copy">
              <p className="eyebrow hero-block" style={{ animationDelay: "0.15s" }}>Tarot intuitivo e terapêutico</p>
              <h1>
                <HeroWords words={["Com", "o", "tarot", "nas", "mãos"]} startIndex={0} />
                <br />
                <HeroWords words={["e", "o", "coração", "aberto,"]} startIndex={5} />
                <br />
                <HeroWords words={["te", "conduzo", "na", "sua", "jornada"]} startIndex={9} />
                <em className="hero-shimmer" style={{ animationDelay: "2.05s, 4.05s" }}>de dentro pra fora.</em>
              </h1>
              <span className="hero__rule hero-block" style={{ animationDelay: "2.5s" }} />
              <p className="hero__intro hero-block" style={{ animationDelay: "2.7s" }}>Leituras intuitivas e terapêuticas para mais autoconhecimento, clareza e transformação na sua vida.</p>
              <div className="hero__actions hero-block" style={{ animationDelay: "3s" }}>
                <a className="button button--coral" href={WHATSAPP_BOOKING_URL} target="_blank" rel="noopener noreferrer">Agendar leitura</a>
                <a className="button button--outline" href="#leituras">Conhecer leituras</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about" id="sobre">
        <div className="container about__grid">
          <div className="about__visual asset-slot" data-asset-slot="retrato da Vanessa">
            <AboutGlyphs />
            <div className="about__portrait">
              <img src="/vanessa-oficial.png" alt="Vanessa segurando cartas de tarot" />
              <span className="about__mark" aria-hidden="true">✦</span>
            </div>
          </div>
          <div className="about__copy">
            <p className="eyebrow eyebrow--dark">Sobre a Intua Guia</p>
            <h2>Olá, sou Vanessa,<br />ou simplesmente Van.</h2>
            <SectionMark />
            <p>Mergulhei no universo do Tarot há mais de cinco anos. Minha abordagem é intuitiva e terapêutica: mais do que prever, meu propósito é ajudar você a se conectar com a sua própria intuição, compreender padrões e tomar decisões com mais consciência.</p>
            <p>Minha jornada começou com o Oráculo dos Orixás, e desde então sigo aprendendo a cada leitura, porque o Tarot é uma linguagem viva que nos reconecta à nossa sabedoria interior.</p>
          </div>
        </div>
      </section>

      <section className="benefits" aria-labelledby="benefits-title">
        <div className="container">
          <div className="section-heading section-heading--light">
            <p className="eyebrow">O que a leitura abre</p>
            <h2 id="benefits-title">Descubra uma nova<br />perspectiva para sua vida</h2>
            <SectionMark />
          </div>
          <BenefitsGrid benefits={benefits} />
        </div>
      </section>

      <ReadingExperience />

      <section className="testimonials" id="depoimentos" aria-labelledby="testimonials-title">
        <div className="container">
          <div className="section-heading section-heading--light">
            <p className="eyebrow">Experiências compartilhadas</p>
            <h2 id="testimonials-title">Depoimentos</h2>
            <SectionMark />
          </div>
          <TestimonialsCarousel testimonials={testimonials} />
        </div>
      </section>

      <section className="faq" id="duvidas" aria-labelledby="faq-title">
        <div className="container faq__grid">
          <div>
            <p className="eyebrow eyebrow--dark">Respostas que acolhem</p>
            <h2 id="faq-title">Dúvidas<br />Frequentes</h2>
            <SectionMark />
            <a className="faq__help" href={WHATSAPP_BOOKING_URL} target="_blank" rel="noopener noreferrer">Ainda tem dúvidas?<span>Fale comigo pelo WhatsApp</span></a>
          </div>
          <FaqAccordion questions={faqs} />
        </div>
      </section>

      <section className="closing-cta" id="agendar">
        <div className="container closing-cta__content">
          <p className="eyebrow">Seu próximo passo</p>
          <h2>Descubra uma nova<br />perspectiva para sua vida.</h2>
          <SectionMark />
          <a className="button button--coral" href={WHATSAPP_BOOKING_URL} target="_blank" rel="noopener noreferrer">Agendar sua leitura</a>
        </div>
      </section>

      <footer id="contato">
        <div className="container footer__content">
          <Brand light />
          <p>Tarot intuitivo e terapêutico para mais autoconhecimento, clareza e transformação.</p>
          <small>© 2026 Intua Guia. Todos os direitos reservados.</small>
          <div className="footer__socials"><span>Me acompanhe</span><a href="#contato" aria-label="Instagram">◎</a><a href="#contato" aria-label="YouTube">▷</a><a href={WHATSAPP_BOOKING_URL} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">◌</a></div>
        </div>
      </footer>
    </main>
  );
}
import ReadingExperience from "./ReadingExperience";
import AboutGlyphs from "./AboutGlyphs";
