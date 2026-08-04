"use client";

import { useEffect, useRef, useState } from "react";

type Foto = { id: string; ordem: number; r2Key: string };
type Momento = { id: string; ordem: number; titulo: string | null; resumo: string | null; audioKey: string | null; fotos: Foto[] };
type Leitura = {
  id: string;
  token: string;
  consulenteNome: string;
  consulenteNascimento: string | null;
  tipoLeitura: string;
  perguntas: string | null;
  status: string;
};

export default function AdminLeituraBuilder({ leituraId }: { leituraId: string }) {
  const [leitura, setLeitura] = useState<Leitura | null>(null);
  const [momentos, setMomentos] = useState<Momento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [publicando, setPublicando] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [resumo, setResumo] = useState("");
  const [audio, setAudio] = useState<Blob | null>(null);
  const [gravando, setGravando] = useState(false);
  const [fotosArquivos, setFotosArquivos] = useState<File[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function iniciarGravacao() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      setAudio(new Blob(chunksRef.current, { type: "audio/webm" }));
      stream.getTracks().forEach((track) => track.stop());
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setGravando(true);
  }

  function pararGravacao() {
    mediaRecorderRef.current?.stop();
    setGravando(false);
  }

  async function carregar() {
    const res = await fetch(`/api/admin/leituras/${leituraId}`);
    const data = await res.json();
    setLeitura(data.leitura);
    setMomentos(data.momentos ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leituraId]);

  async function adicionarMomento(event: React.FormEvent) {
    event.preventDefault();
    setEnviando(true);
    const form = new FormData();
    form.set("titulo", titulo);
    form.set("resumo", resumo);
    if (audio) form.set("audio", audio, "gravacao.webm");
    for (const foto of fotosArquivos) form.append("fotos", foto);

    await fetch(`/api/admin/leituras/${leituraId}/momentos`, { method: "POST", body: form });

    setTitulo("");
    setResumo("");
    setAudio(null);
    setFotosArquivos([]);
    await carregar();
    setEnviando(false);
  }

  async function publicar() {
    setPublicando(true);
    const res = await fetch(`/api/admin/leituras/${leituraId}/publicar`, { method: "POST" });
    const data = await res.json();
    setLeitura(data.leitura);
    setPublicando(false);
  }

  if (carregando) return <p className="admin__carregando">Carregando...</p>;
  if (!leitura) return <p className="admin__carregando">Leitura não encontrada.</p>;

  const link = typeof window !== "undefined" ? `${window.location.origin}/leitura/${leitura.token}` : "";

  return (
    <div className="admin-builder">
      <p className="eyebrow">{leitura.tipoLeitura}</p>
      <h1>{leitura.consulenteNome}</h1>
      <span className="section-mark" aria-hidden="true">✦</span>

      <div className="admin-builder__intake">
        {leitura.consulenteNascimento && <p><strong>Nascimento:</strong> {leitura.consulenteNascimento}</p>}
        {leitura.perguntas && <p><strong>Perguntas:</strong> {leitura.perguntas}</p>}
      </div>

      <div className="admin-builder__link">
        <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
        {leitura.status === "publicada" ? (
          <span className="admin__status admin__status--publicada">Publicada</span>
        ) : (
          <button type="button" className="button button--coral button--small" onClick={publicar} disabled={publicando || momentos.length === 0}>
            {publicando ? "Publicando..." : "Publicar"}
          </button>
        )}
      </div>

      <h2 className="admin-builder__subtitulo">Momentos ({momentos.length})</h2>
      <ol className="admin-builder__momentos">
        {momentos.map((momento) => (
          <li key={momento.id} className="admin-momento">
            <span className="admin-momento__ordem">{String(momento.ordem).padStart(2, "0")}</span>
            <div>
              {momento.titulo && <strong>{momento.titulo}</strong>}
              {momento.resumo && <p>{momento.resumo}</p>}
              <div className="admin-momento__midia">
                {momento.audioKey && <span>🎙 áudio</span>}
                {momento.fotos.length > 0 && <span>🖼 {momento.fotos.length} foto(s)</span>}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <form className="admin-momento-form" onSubmit={adicionarMomento}>
        <h2 className="admin-builder__subtitulo">Adicionar momento</h2>
        <label>
          <span>Título (opcional)</span>
          <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: A raiz da questão" />
        </label>
        <label>
          <span>Resumo / pontos-chave</span>
          <textarea rows={3} value={resumo} onChange={(e) => setResumo(e.target.value)} placeholder="O que esse áudio aborda" />
        </label>
        <label>
          <span>Áudio</span>
          <div className="admin-gravar">
            {!gravando ? (
              <button type="button" className="button button--outline button--small" onClick={iniciarGravacao}>
                {audio ? "🎙 Regravar" : "🎙 Gravar áudio"}
              </button>
            ) : (
              <button type="button" className="button button--coral button--small admin-gravar__ativo" onClick={pararGravacao}>
                ⏹ Parar gravação
              </button>
            )}
            {audio && !gravando && <span className="admin-gravar__status">Áudio gravado ✓</span>}
          </div>
        </label>
        <label>
          <span>Fotos das cartas</span>
          <div className="admin-gravar">
            <button
              type="button"
              className="button button--outline button--small"
              onClick={() => document.getElementById("input-camera")?.click()}
            >
              📷 Tirar foto
            </button>
            <input
              id="input-camera"
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => {
                const novaFoto = e.target.files?.[0];
                if (novaFoto) setFotosArquivos((atual) => [...atual, novaFoto]);
                e.target.value = "";
              }}
            />
            {fotosArquivos.length > 0 && <span className="admin-gravar__status">{fotosArquivos.length} foto(s) ✓</span>}
          </div>
        </label>
        <button type="submit" className="button button--coral" disabled={enviando}>
          {enviando ? "Salvando..." : "Adicionar momento"}
        </button>
      </form>
    </div>
  );
}
