import AdminSolicitarForm from "../../AdminSolicitarForm";

export const metadata = { title: "Solicitar leitura | Admin | Intua Guia" };

export default function AdminSolicitarPage() {
  return (
    <main className="solicitacao">
      <div className="container solicitacao__content solicitacao__content--admin">
        <a href="/admin" className="admin__voltar">← Dashboard</a>
        <AdminSolicitarForm />
      </div>
    </main>
  );
}
