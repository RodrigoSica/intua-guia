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
  const [erroEnvio, setErroEnvio] = useState("");
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

  // Fotos de celular costumam vir em 3-8MB. Redimensionamos para no máximo
  // 1600px no lado maior e recomprimimos em WebP, o que derruba o tamanho
  // pra ~150-400KB sem perda visível — economiza espaço no R2 automaticamente,
  // sem exigir nenhuma ação da Vanessa.
  async function comprimirFoto(arquivo: File): Promise<File> {
    const bitmap = await createImageBitmap(arquivo);
    const maxLado = 1600;
    const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
    const largura = Math.round(bitmap.width * escala);
    const altura = Math.round(bitmap.height * escala);

    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext("2d");
    if (!ctx) return arquivo;
    ctx.drawImage(bitmap, 0, 0, largura, altura);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.8)
    );
    if (!blob) return arquivo;

    const novoNome = arquivo.name.replace(/\.\w+$/, "") + ".webp";
    return new File([blob], novoNome, { type: "image/webp" });
  }

  async function iniciarGravacao() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.start();
    mediaRecorderRef.current = recorder;
    setGravando(true);
  }

  // Retorna uma Promise que só resolve depois que o navegador terminou de
  // gravar (MediaRecorder.stop() é assíncrono). Sem isso, clicar em
  // "Adicionar bloco" logo após parar podia enviar o bloco ANTES do áudio
  // ficar pronto — e quando ele finalmente chegava, caía no bloco seguinte
  // (o que estava sendo preenchido na hora), não no que você acabou de gravar.
  function pararGravacaoEObterAudio(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") { resolve(null); return; }
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach((track) => track.stop());
        resolve(new Blob(chunksRef.current, { type: "audio/webm" }));
      };
      recorder.stop();
    });
  }

  async function pararGravacao() {
    const blob = await pararGravacaoEObterAudio();
    if (blob) setAudiosGravados((atual) => [...atual, blob]);
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

    // Se esqueceu de clicar "Parar gravação" antes de enviar, para agora e
    // espera o áudio — assim ele entra NESTE bloco, não no próximo.
    let audiosParaEnviar = audiosGravados;
    if (gravando) {
      const blob = await pararGravacaoEObterAudio();
      setGravando(false);
      if (blob) audiosParaEnviar = [...audiosGravados, blob];
    }

    const form = new FormData();
    form.set("titulo", titulo);
    form.set("resumo", resumo);
    audiosParaEnviar.forEach((blob, i) => form.append("audios", blob, `gravacao-${i + 1}.webm`));
    for (const foto of fotosArquivos) form.append("fotos", foto);

    // Antes o resultado do fetch nunca era checado: se o envio falhasse (rede,
    // servidor, o que fosse), o formulário limpava do mesmo jeito, dando a
    // impressão de que o bloco tinha sido salvo — quando na verdade sumia de
    // vez. Agora só limpa e recarrega se o servidor confirmou 201.
    let ok = false;
    try {
      const res = await fetch(`/api/admin/leituras/${leituraId}/momentos`, { method: "POST", body: form });
      ok = res.ok;
      if (!ok) setErroEnvio(`Não foi possível salvar (erro ${res.status}). Tente novamente — nada foi perdido.`);
    } catch {
      setErroEnvio("Não foi possível salvar. Confira sua conexão e tente novamente — nada foi perdido.");
    }

    if (ok) {
      setErroEnvio("");
      setTitulo("");
      setResumo("");
      setAudiosGravados([]);
      setFotosArquivos([]);
      await carregar();
    } else {
      // Falhou: título, resumo e fotos já continuam no estado (nunca foram
      // tocados). Só precisa recolocar o áudio, caso uma gravação em
      // andamento tenha sido incorporada a audiosParaEnviar acima. Assim o
      // próximo clique em "Adicionar bloco" simplesmente tenta de novo, sem
      // o usuário ter que preencher nada outra vez.
      setAudiosGravados(audiosParaEnviar);
    }
    setEnviando(false);
  }

  async function publicar() {
    setPublicando(true);
    setErroEnvio("");
    try {
      const res = await fetch(`/api/admin/leituras/${leituraId}/publicar`, { method: "POST" });
      if (!res.ok) {
        setErroEnvio(`Não foi possível publicar (erro ${res.status}). Tente novamente.`);
        return;
      }
      const data = await res.json();
      setLeitura(data.leitura);
    } catch {
      setErroEnvio("Não foi possível publicar. Confira sua conexão e tente novamente.");
    } finally {
      setPublicando(false);
    }
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

      {erroEnvio && <p className="admin-momento-form__erro admin-builder__erro">⚠ {erroEnvio}</p>}

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
              onChange={async (e) => {
                const novaFoto = e.target.files?.[0];
                e.target.value = "";
                if (!novaFoto) return;
                const comprimida = await comprimirFoto(novaFoto);
                setFotosArquivos((atual) => [...atual, comprimida]);
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
