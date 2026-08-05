import AdminSolicitarForm from "../../AdminSolicitarForm";

export const metadata = { title: "Solicitar leitura | Admin | Intua Guia" };

export default function AdminSolicitarPage() {
  return (
    <main className="solicitacao">
      <div className="container solicitacao__content solicitacao__content--admin">
        <a href="/admin" className="admin__voltar">← Dashboard</a>
        <p className="eyebrow eyebrow--dark">Solicitar leitura</p>
        <h1>Nova leitura</h1>
        <span className="section-mark" aria-hidden="true">✦</span>
        <p className="solicitacao__intro">
          Só nome e tipo de leitura são obrigatórios — o resto pode ser completado depois no dashboard.
        </p>
        <AdminSolicitarForm />
      </div>
    </main>
  );
}
