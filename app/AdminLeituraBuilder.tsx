"use client";

import { useEffect, useRef, useState } from "react";

type Foto = { id: string; ordem: number; r2Key: string };
type Audio = { id: string; ordem: number; r2Key: string };
type Momento = {
  id: string;
  ordem: number;
  titulo: string | null;
  resumo: string | null;
  pontosChave: string | null;
  audios: Audio[];
  fotos: Foto[];
};
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

  // editandoId === null -> formulário em modo "novo bloco".
  // editandoId === id de um momento -> formulário reaproveitado para editá-lo:
  // mesmos campos, mas título/resumo/pontos-chave vêm pré-preenchidos e as
  // fotos/áudios já salvos aparecem para revisão (com opção de remover).
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [fotosExistentes, setFotosExistentes] = useState<Foto[]>([]);
  const [audiosExistentes, setAudiosExistentes] = useState<Audio[]>([]);
  const [fotosRemovidasIds, setFotosRemovidasIds] = useState<string[]>([]);
  const [audiosRemovidosIds, setAudiosRemovidosIds] = useState<string[]>([]);

  const [titulo, setTitulo] = useState("");
  const [resumo, setResumo] = useState("");
  const [pontosChave, setPontosChave] = useState("");
  const [gerando, setGerando] = useState(false);
  const [erroGeracao, setErroGeracao] = useState("");
  // Um bloco pode ter quantos áudios e fotos a Vanessa quiser — cada clique
  // em "Gravar áudio"/"Tirar foto" acrescenta mais um à lista deste bloco.
  const [audiosGravados, setAudiosGravados] = useState<Blob[]>([]);
  const [gravando, setGravando] = useState(false);
  const [erroGravacao, setErroGravacao] = useState("");
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
    setErroGravacao("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.start();
      mediaRecorderRef.current = recorder;
      setGravando(true);
    } catch {
      setErroGravacao(
        "Não foi possível acessar o microfone. No app, vá em Ajustes do Android > Apps > Intua Guia > Permissões > Microfone e permita o acesso."
      );
    }
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
    setGravando(false);
    if (!blob) return;
    const atualizados = [...audiosGravados, blob];
    setAudiosGravados(atualizados);
    await gerarConteudo(atualizados);
  }

  // Título, resumo e pontos-chave nascem da IA a partir do que foi gravado —
  // a Vanessa só revisa e ajusta antes de salvar o bloco. "Gerar novamente"
  // chama esta mesma função por baixo, usando os áudios que já estão no bloco.
  // Em modo edição, só considera áudio gravado NESTA sessão (o já salvo
  // continua no bloco do jeito que está, a menos que ela regrave).
  async function gerarConteudo(audiosParaGerar: Blob[]) {
    if (audiosParaGerar.length === 0) return;
    setGerando(true);
    setErroGeracao("");
    try {
      const form = new FormData();
      audiosParaGerar.forEach((blob, i) => form.append("audios", blob, `gravacao-${i + 1}.webm`));
      const res = await fetch(`/api/admin/leituras/${leituraId}/momentos/gerar`, { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErroGeracao(data?.error || `Não foi possível gerar o conteúdo (erro ${res.status}). Pode preencher na mão.`);
        return;
      }
      const data = await res.json();
      setTitulo(data.conteudo.titulo || "");
      setResumo(data.conteudo.resumo || "");
      setPontosChave(data.conteudo.pontosChave || "");
    } catch {
      setErroGeracao("Não foi possível gerar o conteúdo. Confira sua conexão ou preencha na mão.");
    } finally {
      setGerando(false);
    }
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

  function limparFormulario() {
    setEditandoId(null);
    setTitulo("");
    setResumo("");
    setPontosChave("");
    setFotosExistentes([]);
    setAudiosExistentes([]);
    setFotosRemovidasIds([]);
    setAudiosRemovidosIds([]);
    setAudiosGravados([]);
    setFotosArquivos([]);
    setErroGeracao("");
  }

  function iniciarEdicao(momento: Momento) {
    setEditandoId(momento.id);
    setTitulo(momento.titulo ?? "");
    setResumo(momento.resumo ?? "");
    setPontosChave(momento.pontosChave ?? "");
    setFotosExistentes(momento.fotos);
    setAudiosExistentes(momento.audios);
    setFotosRemovidasIds([]);
    setAudiosRemovidosIds([]);
    setAudiosGravados([]);
    setFotosArquivos([]);
    setErroEnvio("");
    setErroGeracao("");
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  async function apagarBloco(momento: Momento) {
    if (
      !window.confirm(
        `Apagar o bloco "${momento.titulo || "sem título"}"?\n\nOs áudios e fotos dele somem junto. Não dá pra desfazer.`
      )
    ) {
      return;
    }
    const res = await fetch(`/api/admin/leituras/${leituraId}/momentos/${momento.id}`, { method: "DELETE" });
    if (!res.ok) {
      setErroEnvio("Não foi possível apagar o bloco. Tente novamente.");
      return;
    }
    if (editandoId === momento.id) limparFormulario();
    await carregar();
  }

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
    form.set("pontosChave", pontosChave);
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
      limparFormulario();
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

  async function salvarEdicao(event: React.FormEvent) {
    event.preventDefault();
    if (!editandoId) return;
    setEnviando(true);

    let audiosParaEnviar = audiosGravados;
    if (gravando) {
      const blob = await pararGravacaoEObterAudio();
      setGravando(false);
      if (blob) audiosParaEnviar = [...audiosGravados, blob];
    }

    const form = new FormData();
    form.set("titulo", titulo);
    form.set("resumo", resumo);
    form.set("pontosChave", pontosChave);
    fotosRemovidasIds.forEach((id) => form.append("removerFotos", id));
    audiosRemovidosIds.forEach((id) => form.append("removerAudios", id));
    audiosParaEnviar.forEach((blob, i) => form.append("audios", blob, `gravacao-${i + 1}.webm`));
    for (const foto of fotosArquivos) form.append("fotos", foto);

    let ok = false;
    try {
      const res = await fetch(`/api/admin/leituras/${leituraId}/momentos/${editandoId}`, {
        method: "PATCH",
        body: form,
      });
      ok = res.ok;
      if (!ok) setErroEnvio(`Não foi possível salvar (erro ${res.status}). Tente novamente — nada foi perdido.`);
    } catch {
      setErroEnvio("Não foi possível salvar. Confira sua conexão e tente novamente — nada foi perdido.");
    }

    if (ok) {
      setErroEnvio("");
      limparFormulario();
      await carregar();
    } else {
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
        <a className="button button--outline button--small" href={`/leitura/${leitura.token}`} target="_blank" rel="noreferrer">
          Ver
        </a>
        {leitura.status === "publicada" ? (
          <>
            <span className="admin__status admin__status--publicada">Publicada</span>
            <button type="button" className="button button--outline button--small" onClick={publicar} disabled={publicando}>
              {publicando ? "Publicando..." : "Publicar novamente"}
            </button>
          </>
        ) : (
          <button type="button" className="button button--coral button--small" onClick={publicar} disabled={publicando || momentos.length === 0}>
            {publicando ? "Publicando..." : "Publicar"}
          </button>
        )}
      </div>

      <p className="admin-energia__salvo admin-energia__salvo--salvo">✓ Salvo</p>

      {erroEnvio && <p className="admin-momento-form__erro admin-builder__erro">⚠ {erroEnvio}</p>}

      <h2 className="admin-builder__subtitulo">Blocos ({momentos.length})</h2>
      <ol className="admin-builder__momentos">
        {momentos.map((momento) => (
          <li key={momento.id} className={`admin-momento ${editandoId === momento.id ? "admin-momento--editando" : ""}`}>
            <span className="admin-momento__ordem">{String(momento.ordem).padStart(2, "0")}</span>
            <div>
              {momento.titulo && <strong>{momento.titulo}</strong>}
              {momento.resumo && <p>{momento.resumo}</p>}
              {momento.pontosChave && <p className="admin-momento__pontos">{momento.pontosChave}</p>}
              <div className="admin-momento__midia">
                {momento.audios.length > 0 && <span>🎙 {momento.audios.length} áudio(s)</span>}
                {momento.fotos.length > 0 && <span>🖼 {momento.fotos.length} foto(s)</span>}
              </div>
            </div>
            <div className="admin-momento__acoes">
              <button type="button" className="admin-momento__editar" onClick={() => iniciarEdicao(momento)}>
                ✎ Editar
              </button>
              <button type="button" className="admin-momento__apagar-bloco" onClick={() => apagarBloco(momento)}>
                🗑
              </button>
            </div>
          </li>
        ))}
      </ol>

      <form className="admin-momento-form" onSubmit={editandoId ? salvarEdicao : adicionarBloco}>
        <h2 className="admin-builder__subtitulo">
          {editandoId ? `Editando bloco ${String(momentos.find((m) => m.id === editandoId)?.ordem ?? "").padStart(2, "0")}` : "Novo bloco"}
        </h2>
        <p className="admin-momento-form__ajuda">
          {editandoId
            ? "Ajuste o texto, remova o que não quiser ou grave/tire mais mídia para este bloco."
            : "Um bloco é um momento da leitura: quantas cartas e áudios você quiser, juntos."}
        </p>
        <label>
          <span>Áudios ({audiosExistentes.length + audiosGravados.length})</span>
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
          {erroGravacao && <p className="admin-momento-form__erro">⚠ {erroGravacao}</p>}
          {audiosExistentes.length > 0 && (
            <ul className="admin-midia-lista admin-midia-lista--existente">
              {audiosExistentes.map((audio) => (
                <li key={audio.id}>
                  <audio controls preload="none" src={`/midia/${audio.r2Key}`} />
                  <button
                    type="button"
                    onClick={() => {
                      setAudiosExistentes((a) => a.filter((x) => x.id !== audio.id));
                      setAudiosRemovidosIds((ids) => [...ids, audio.id]);
                    }}
                    aria-label="Remover áudio salvo"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          {audiosGravados.length > 0 && (
            <ul className="admin-midia-lista">
              {audiosGravados.map((_, i) => (
                <li key={i}>
                  Áudio novo {i + 1} ✓
                  <button type="button" onClick={() => setAudiosGravados((a) => a.filter((_, j) => j !== i))} aria-label={`Remover áudio ${i + 1}`}>×</button>
                </li>
              ))}
            </ul>
          )}
        </label>

        <p className="admin-momento-form__ajuda">
          Título, resumo e pontos-chave são gerados a partir do áudio gravado acima.
          Revise e ajuste à vontade antes de salvar.
        </p>
        {erroGeracao && <p className="admin-momento-form__erro">⚠ {erroGeracao}</p>}
        <label>
          <span>Título {gerando && "— gerando..."}</span>
          <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Gerado após gravar o áudio" disabled={gerando} />
        </label>
        <label>
          <span>Resumo {gerando && "— gerando..."}</span>
          <textarea rows={2} value={resumo} onChange={(e) => setResumo(e.target.value)} placeholder="Gerado após gravar o áudio" disabled={gerando} />
        </label>
        <label>
          <span>Pontos-chave {gerando && "— gerando..."}</span>
          <textarea rows={3} value={pontosChave} onChange={(e) => setPontosChave(e.target.value)} placeholder="Gerado após gravar o áudio" disabled={gerando} />
        </label>
        <button
          type="button"
          className="button button--outline button--small"
          onClick={() => gerarConteudo(audiosGravados)}
          disabled={gerando || audiosGravados.length === 0}
        >
          {gerando ? "Gerando..." : "🪄 Gerar novamente"}
        </button>

        <label>
          <span>Fotos das cartas ({fotosExistentes.length + fotosArquivos.length})</span>
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
          {fotosExistentes.length > 0 && (
            <ul className="admin-midia-lista admin-midia-lista--existente admin-midia-lista--fotos">
              {fotosExistentes.map((foto) => (
                <li key={foto.id}>
                  <img src={`/midia/${foto.r2Key}`} alt="Carta já salva neste bloco" />
                  <button
                    type="button"
                    onClick={() => {
                      setFotosExistentes((f) => f.filter((x) => x.id !== foto.id));
                      setFotosRemovidasIds((ids) => [...ids, foto.id]);
                    }}
                    aria-label="Remover foto salva"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
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
        <div className="admin-momento-form__acoes-finais">
          <button type="submit" className="button button--coral admin-momento-form__adicionar" disabled={enviando}>
            {editandoId ? (enviando ? "Salvando..." : "Salvar alterações") : (
              <>
                <span aria-hidden="true">+</span> {enviando ? "Salvando..." : "Adicionar bloco"}
              </>
            )}
          </button>
          {editandoId && (
            <button type="button" className="button button--outline button--small" onClick={limparFormulario} disabled={enviando}>
              Cancelar edição
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
