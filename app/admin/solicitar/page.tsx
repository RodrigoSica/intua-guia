import SolicitacaoForm from "../../SolicitacaoForm";

export const metadata = { title: "Solicitar leitura | Admin | Intua Guia" };

export default function AdminSolicitarPage() {
  return (
    <main className="solicitacao">
      <div className="container solicitacao__content">
        <a href="/admin" className="admin__voltar">← Dashboard</a>
        <p className="eyebrow eyebrow--dark">Solicitar leitura</p>
        <h1>Conte um pouco<br />sobre você</h1>
        <span className="section-mark" aria-hidden="true">✦</span>
        <p className="solicitacao__intro">
          Preencha os dados da pessoa a ser consultada — o cadastro entra direto no dashboard.
        </p>
        <SolicitacaoForm />
      </div>
    </main>
  );
}
