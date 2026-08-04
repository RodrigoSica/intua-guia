"use client";

import { useEffect, useRef, useState } from "react";

type Foto = { id: string; ordem: number; r2Key: string };
type Audio = { id: string; ordem: number; r2Key: string };
type Momento = { id: string; ordem: number; titulo: string | null; resumo: string | null; audios: Audio[]; fotos: Foto[] };
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
  // Um bloco pode ter quantos áudios e fotos a Vanessa quiser — cada clique
  // em "Gravar áudio"/"Tirar foto" acrescenta mais um à lista deste bloco.
  const [audiosGravados, setAudiosGravados] = useState<Blob[]>([]);
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
      setAudiosGravados((atual) => [...atual, new Blob(chunksRef.current, { type: "audio/webm" })]);
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

  async function adicionarBloco(event: React.FormEvent) {
    event.preventDefault();
    setEnviando(true);
    const form = new FormData();
    form.set("titulo", titulo);
    form.set("resumo", resumo);
    audiosGravados.forEach((blob, i) => form.append("audios", blob, `gravacao-${i + 1}.webm`));
    for (const foto of fotosArquivos) form.append("fotos", foto);

    await fetch(`/api/admin/leituras/${leituraId}/momentos`, { method: "POST", body: form });

    setTitulo("");
    setResumo("");
    setAudiosGravados([]);
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

      <h2 className="admin-builder__subtitulo">Blocos ({momentos.length})</h2>
      <ol className="admin-builder__momentos">
        {momentos.map((momento) => (
          <li key={momento.id} className="admin-momento">
            <span className="admin-momento__ordem">{String(momento.ordem).padStart(2, "0")}</span>
            <div>
              {momento.titulo && <strong>{momento.titulo}</strong>}
              {momento.resumo && <p>{momento.resumo}</p>}
              <div className="admin-momento__midia">
                {momento.audios.length > 0 && <span>🎙 {momento.audios.length} áudio(s)</span>}
                {momento.fotos.length > 0 && <span>🖼 {momento.fotos.length} foto(s)</span>}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <form className="admin-momento-form" onSubmit={adicionarBloco}>
        <h2 className="admin-builder__subtitulo">Novo bloco</h2>
        <p className="admin-momento-form__ajuda">Um bloco é um momento da leitura: quantas cartas e áudios você quiser, juntos.</p>
        <label>
          <span>Título (opcional)</span>
          <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: A raiz da questão" />
        </label>
        <label>
          <span>Resumo / pontos-chave</span>
          <textarea rows={3} value={resumo} onChange={(e) => setResumo(e.target.value)} placeholder="O que esse bloco aborda" />
        </label>
        <label>
          <span>Áudios ({audiosGravados.length})</span>
          <div className="admin-gravar">
            {!gravando ? (
              <button type="button" className="button button--outline button--small" onClick={iniciarGravacao}>
                🎙 Gravar áudio
              </button>
            ) : (
              <button type="button" className="button button--coral button--small admin-gravar__ativo" onClick={pararGravacao}>
                ⏹ Parar gravação
              </button>
            )}
          </div>
          {audiosGravados.length > 0 && (
            <ul className="admin-midia-lista">
              {audiosGravados.map((_, i) => (
                <li key={i}>
                  Áudio {i + 1} ✓
                  <button type="button" onClick={() => setAudiosGravados((a) => a.filter((_, j) => j !== i))} aria-label={`Remover áudio ${i + 1}`}>×</button>
                </li>
              ))}
            </ul>
          )}
        </label>
        <label>
          <span>Fotos das cartas ({fotosArquivos.length})</span>
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
          </div>
          {fotosArquivos.length > 0 && (
            <ul className="admin-midia-lista">
              {fotosArquivos.map((f, i) => (
                <li key={i}>
                  {f.name.slice(0, 18)}
                  <button type="button" onClick={() => setFotosArquivos((a) => a.filter((_, j) => j !== i))} aria-label={`Remover foto ${i + 1}`}>×</button>
                </li>
              ))}
            </ul>
          )}
        </label>
        <button type="submit" className="button button--coral admin-momento-form__adicionar" disabled={enviando}>
          <span aria-hidden="true">+</span> {enviando ? "Salvando..." : "Adicionar bloco"}
        </button>
      </form>
    </div>
  );
}
