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
    highlight: "Eu achei que precisava de respostas, mas descobri que precisava me escutar",
    quote: "Foi muito mais do que tirar cartas, me ajudou a enxergar com profundidade o que estava vivendo, entender minhas escolhas e, principalmente, me entender melhor",
    name: "L.M.",
    age: "36 anos",
    reading: "Leitura Caminhos e Desafios",
    initial: "L",
  },
  {
    highlight: "Saí com uma clareza que eu não imaginava que podia ter",
    quote: "Van, foi impressionante como, com apenas duas perguntas, você conseguiu me mostrar o que eu não estava conseguindo enxergar. A leitura apesar de breve foi com muitos detalhes. Me senti super acolhida, como se você realmente me conhecesse. Obrigada de coração!",
    name: "R.S.",
    age: "29 anos",
    reading: "Leitura de 2 Perguntas",
    initial: "R",
  },
  {
    highlight: "Parecia que estava lendo minha mente",
    quote: "Cada ponto que apareceu na leitura fez sentido com o que estou vivendo agora. Foi tipo um raio-x do meu momento, me mostrando o que preciso focar e mudar. Saí com a cabeça cheia de ideias e muito mais clareza do caminho",
    name: "R.M.",
    age: "29 anos",
    reading: "Leitura Mandala Astrológica",
    initial: "R",
  },
  {
    highlight: "Me enxerguei de um jeito que nunca tinha conseguido antes",
    quote: "Foi um mergulho profundo. Me trouxe muitas reflexões sobre mim, entendi melhor padrões que repito, confirmou algumas coisas e me mostrou no que já estou indo bem. Foi como abrir uma janela para dentro de mim",
    name: "C.S.",
    age: "48 anos",
    reading: "Leitura Se Desvendando",
    initial: "C",
  },
  {
    highlight: "Descobri que meu corpo também fala",
    quote: "A leitura de equilíbrio energético foi reveladora. Consegui entender de onde vinham certos bloqueios que eu nem imaginava estar carregando. As mensagens foram como um mapa: pude reconhecer o que precisava de mais atenção e como cuidar melhor da minha energia no dia a dia",
    name: "D.A.",
    age: "31 anos",
    reading: "Leitura Equilíbrio Energético",
    initial: "D",
  },
  {
    highlight: "Parecia que as cartas estavam contando minha vida!",
    quote: "Fiquei impressionada com o tanto de coisa que fez sentido pra mim. A leitura foi completa, passou por várias áreas da minha vida e trouxe uns toques que eu precisava ouvir. Senti como se tudo tivesse se encaixado, saí com a cabeça mais leve e várias ideias de como seguir",
    name: "T.D.",
    age: "25 anos",
    reading: "Leitura Cigana",
    initial: "T",
  },
  {
    highlight: "Chocada com o tanto de informação e como fez sentido",
    quote: "Me deu uma visão geral, consegui conectar várias coisas que pareciam confusas. Os áudios trouxe muita consciência do meu momento e que tenho muito trabalho pra fazer pra chegar aonde quero. Vale muito o jogo",
    name: "C.F.",
    age: "38 anos",
    reading: "Leitura Mandala Astrológica",
    initial: "C",
  },
  {
    highlight: "Me ajudou a entender o que tá acontecendo entre a gente",
    quote: "Achei que fosse ouvir só o que já sabia, mas foi muito mais do que isso. A leitura me mostrou coisas que eu sentia, mas não conseguia explicar. Consegui ver melhor o lado dele e o que eu posso fazer da minha parte. Foi uma conversa que me abriu os olhos",
    name: "A.L.",
    age: "21 anos",
    reading: "Leitura Círculo de Afetos",
    initial: "A",
  },
  {
    highlight: "A leitura me trouxe consciência",
    quote: "Eu estava perdida, achando que precisava de alguém pra dizer o que fazer, mas a leitura me mostrou que as respostas já estavam em mim. Foi transformador perceber isso",
    name: "C.R.",
    age: "41 anos",
    reading: "Leitura Caminhos e Desafios",
    initial: "C",
  },
];

const faqs = [
  {
    question: "Como faço para agendar uma consulta?",
    answer: "Basta clicar no botão do WhatsApp aqui na página. Vou te responder pessoalmente, entender sua necessidade e sugerir a leitura ideal.",
  },
  {
    question: "Como funciona a consulta de tarot?",
    answer: "Realizo a leitura no horário combinado e envio por áudio no seu WhatsApp, junto com a foto do jogo. Você pode ouvir com calma, no seu tempo.",
  },
  {
    question: "Preciso estar disponível no momento da consulta?",
    answer: "Não. O envio é assíncrono e pode ser acessado quando quiser.",
  },
  {
    question: "O que preciso informar antes da leitura?",
    answer: "Um breve contexto da situação, além do nome completo e data de nascimento das pessoas envolvidas.",
  },
  {
    question: "Preciso fazer jogos diferentes para perguntas diferentes?",
    answer: "Sim, cada jogo foca em um tema específico para garantir profundidade.",
  },
  {
    question: "É tudo sigiloso?",
    answer: "Sim. Privacidade e respeito são prioridade.",
  },
  {
    question: "Preciso saber exatamente o que perguntar?",
    answer: "Não se preocupe. Posso te ajudar a formular a pergunta. Há também leituras mais amplas para momentos de vida.",
  },
  {
    question: "As leituras são ao vivo ou gravadas?",
    answer: "São gravadas e entregues via WhatsApp.",
  },
  {
    question: "Quanto tempo dura cada consulta?",
    answer: "Depende da leitura: de 30 minutos a até 2 horas.",
  },
  {
    question: "Preciso acreditar em algo específico?",
    answer: "Não. O tarot é acessível a qualquer pessoa aberta à escuta simbólica.",
  },
  {
    question: "Posso perguntar sobre qualquer área?",
    answer: "Sim, exceto: saúde, justiça, paternidade, jogos de azar ou trabalhos mágicos para terceiros.",
  },
  {
    question: "O que acontece depois da consulta?",
    answer: "A leitura continua reverberando. Você pode ouvir quantas vezes quiser e me chamar se surgirem dúvidas pontuais.",
  },
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
