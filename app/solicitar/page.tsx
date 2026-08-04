import SolicitacaoForm from "../SolicitacaoForm";

export const metadata = {
  title: "Solicitar leitura | Intua Guia",
  description: "Conte um pouco sobre você e escolha sua leitura de tarot.",
};

export default function SolicitarPage() {
  return (
    <main className="solicitacao">
      <div className="container solicitacao__content">
        <a href="/" className="brand-link" aria-label="Voltar ao início">
          <span className="brand">
            <img src="/intua-guia-logo.svg" alt="Intua Guia" />
          </span>
        </a>
        <p className="eyebrow eyebrow--dark">Solicitar leitura</p>
        <h1>Conte um pouco<br />sobre você</h1>
        <span className="section-mark" aria-hidden="true">✦</span>
        <p className="solicitacao__intro">
          Preencha os dados abaixo para que a Vanessa possa preparar sua leitura com atenção e cuidado.
        </p>
        <SolicitacaoForm />
      </div>
    </main>
  );
}
