import AdminLeituraBuilder from "../../../AdminLeituraBuilder";

export const metadata = { title: "Montar leitura | Intua Guia" };

export default async function AdminLeituraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="admin">
      <div className="container">
        <a href="/admin" className="admin__voltar">← Todas as leituras</a>
        <AdminLeituraBuilder leituraId={id} />
      </div>
    </main>
  );
}
