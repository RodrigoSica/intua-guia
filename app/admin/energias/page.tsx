import AdminEnergiaLista from "../../AdminEnergiaLista";


export const metadata = { title: "Energia vibracional do nome | Intua Guia" };

export default function AdminEnergiaPage() {
  return (
    <main className="admin">
      <div className="container">
        <a href="/admin" className="admin__voltar">← Dashboard</a>
        <p className="eyebrow">Admin</p>
        <h1>Energia vibracional do nome</h1>
        <span className="section-mark" aria-hidden="true">✦</span>
        <AdminEnergiaLista />
      </div>
    </main>
  );
}
