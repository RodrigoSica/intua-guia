import AdminEnergiaBuilder from "../../../AdminEnergiaBuilder";

export const metadata = { title: "Montar energia vibracional | Intua Guia" };

export default async function AdminEnergiaBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="admin">
      <div className="container">
        <a href="/admin/energias" className="admin__voltar">← Todas as leituras de nome</a>
        <AdminEnergiaBuilder energiaId={id} />
      </div>
    </main>
  );
}
