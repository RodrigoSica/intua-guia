import AdminClientesDashboard from "../AdminClientesDashboard";

export const metadata = { title: "Admin | Intua Guia" };

export default function AdminPage() {
  return (
    <main className="admin">
      <div className="container">
        <p className="eyebrow">Admin</p>
        <h1>Dashboard</h1>
        <span className="section-mark" aria-hidden="true">✦</span>

        <nav className="admin-nav">
          <a href="/admin/solicitar" className="button button--outline button--small">Solicitar leitura</a>
          <a href="/admin/leituras" className="button button--coral button--small">Fazer leitura</a>
        </nav>

        <AdminClientesDashboard />
      </div>
    </main>
  );
}
