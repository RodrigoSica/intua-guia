"use client";

import { useEffect, useRef, useState } from "react";
import FotoEditor from "./FotoEditor";

type Foto = { id: string; ordem: number; r2Key: string };
type Audio = { id: string; ordem: number; r2Key: string };
type Momento = {
  id: string;
  ordem: number;
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

type WakeLockLike = { release: () => Promise<void> };

export default function AdminLeituraBuilder({ leituraId }: { leituraId: string }) {
  const [leitura, setLeitura] = useState<Leitura | null>(null);
  const [momentos, setMomentos] = useState<Momento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState("");
  const [publicando, setPublicando] = useState(false);

  // editandoId === null -> formulário em modo "novo bloco".
  // editandoId === id de um momento -> formulário reaproveitado para editá-lo:
  // as fotos/áudios já salvos aparecem para revisão (com opção de remover).
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [fotosExistentes, setFotosExistentes] = useState<Foto[]>([]);
  const [audiosExistentes, setAudiosExistentes] = useState<Audio[]>([]);
  const [fotosRemovidasIds, setFotosRemovidasIds] = useState<string[]>([]);
  const [audiosRemovidosIds, setAudiosRemovidosIds] = useState<string[]>([]);

  // Um bloco pode ter quantos áudios e fotos a Vanessa quiser — cada clique
  // em "Gravar áudio"/"Tirar foto"/"Anexar foto" acrescenta mais um à lista.
  const [audiosGravados, setAudiosGravados] = useState<Blob[]>([]);
  const [gravando, setGravando] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [erroGravacao, setErroGravacao] = useState("");
  const [fotosArquivos, setFotosArquivos] = useState<File[]>([]);
  const [fotoEmEdicao, setFotoEmEdicao] = useState<File | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const wakeLockRef = useRef<WakeLockLike | null>(null);

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

  // Mantém a tela acesa enquanto grava — sem isso, o celular apaga a tela
  // sozinho no meio de uma gravação longa (o áudio continua, mas ela não
  // sabe que continua). Sem suporte (ex: iOS mais antigo) ou permissão
  // negada, a gravação funciona igual, só a tela pode apagar.
  async function solicitarTelaAcesa() {
    try {
      const nav = navigator as Navigator & { wakeLock?: { request: (tipo: "screen") => Promise<WakeLockLike> } };
      wakeLockRef.current = (await nav.wakeLock?.request("screen")) ?? null;
    } catch {
      wakeLockRef.current = null;
    }
  }

  function liberarTelaAcesa() {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }

  async function iniciarGravacao() {
    setErroGravacao("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Sem isso, o navegador escolhe o bitrate sozinho — em alguns celulares
      // isso sai bem mais alto do que voz precisa (o servidor chegou a
      // recusar um bloco com erro 413, "arquivo grande demais"). 32kbps é de
      // sobra para fala clara e deixa o áudio de um bloco inteiro na casa de
      // poucos MB, mesmo com vários minutos gravados.
      const recorder = new MediaRecorder(stream, { audioBitsPerSecond: 32000 });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.start();
      mediaRecorderRef.current = recorder;
      setGravando(true);
      setPausado(false);
      await solicitarTelaAcesa();
    } catch {
      setErroGravacao(
        "Não foi possível acessar o microfone. No app, vá em Ajustes do Android > Apps > Intua Guia > Permissões > Microfone e permita o acesso."
      );
    }
  }

  function pausarGravacao() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    recorder.pause();
    setPausado(true);
  }

  function retomarGravacao() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "paused") return;
    recorder.resume();
    setPausado(false);
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
        liberarTelaAcesa();
        resolve(new Blob(chunksRef.current, { type: "audio/webm" }));
      };
      recorder.stop();
    });
  }

  async function pararGravacao() {
    const blob = await pararGravacaoEObterAudio();
    setGravando(false);
    setPausado(false);
    if (!blob) return;
    setAudiosGravados((atual) => [...atual, blob]);
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
    setFotosExistentes([]);
    setAudiosExistentes([]);
    setFotosRemovidasIds([]);
    setAudiosRemovidosIds([]);
    setAudiosGravados([]);
    setFotosArquivos([]);
  }

  function iniciarEdicao(momento: Momento) {
    setEditandoId(momento.id);
    setFotosExistentes(momento.fotos);
    setAudiosExistentes(momento.audios);
    setFotosRemovidasIds([]);
    setAudiosRemovidosIds([]);
    setAudiosGravados([]);
    setFotosArquivos([]);
    setErroEnvio("");
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  // 413 = bloco grande demais para o servidor aceitar de uma vez (geralmente
  // áudio de vários minutos). Sem esse caso especial, ela via só "erro 413" —
  // sem entender que é tamanho, nem o que fazer a respeito.
  function mensagemErroEnvio(status: number): string {
    if (status === 413) {
      return "Esse bloco ficou grande demais para enviar de uma vez (provavelmente o áudio é muito longo). Tente dividir em blocos menores — grave em partes mais curtas, salvando um bloco a cada vez, em vez de tudo junto.";
    }
    return `Não foi possível salvar (erro ${status}). Tente novamente — nada foi perdido.`;
  }

  async function apagarBloco(momento: Momento) {
    if (
      !window.confirm(
        `Apagar o bloco ${String(momento.ordem).padStart(2, "0")}?\n\nOs áudios e fotos dele somem junto. Não dá pra desfazer.`
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
      setPausado(false);
      if (blob) audiosParaEnviar = [...audiosGravados, blob];
    }

    const form = new FormData();
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
      if (!ok) setErroEnvio(mensagemErroEnvio(res.status));
    } catch {
      setErroEnvio("Não foi possível salvar. Confira sua conexão e tente novamente — nada foi perdido.");
    }

    if (ok) {
      setErroEnvio("");
      limparFormulario();
      await carregar();
    } else {
      // Falhou: as fotos já continuam no estado (nunca foram tocadas). Só
      // precisa recolocar o áudio, caso uma gravação em andamento tenha sido
      // incorporada a audiosParaEnviar acima. Assim o próximo clique em
      // "Adicionar bloco" simplesmente tenta de novo, sem preencher nada de novo.
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
      setPausado(false);
      if (blob) audiosParaEnviar = [...audiosGravados, blob];
    }

    const form = new FormData();
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
      if (!ok) setErroEnvio(mensagemErroEnvio(res.status));
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
    // O incidente que motivou este aviso: ela gravou áudio e tirou foto, mas
    // nunca clicou em "Adicionar bloco"/"Salvar alterações" — o rascunho só
    // existia na memória do navegador. Ao publicar (ou tentar), nada daquilo
    // ia pra leitura, e ao atualizar a página o rascunho sumiu de vez.
    if (temRascunhoNaoSalvo) {
      const continuar = window.confirm(
        'Este bloco tem áudio ou foto que ainda não foi salvo — clique em "Adicionar bloco" (ou "Salvar alterações") antes de publicar, ou esse conteúdo não vai aparecer na leitura e pode se perder.\n\nPublicar mesmo assim?'
      );
      if (!continuar) return;
    }
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
  // Áudio/foto ainda não enviados ao servidor — gravando, gravado mas não
  // salvo, anexado mas não salvo, ou removido mas a remoção não confirmada.
  const temRascunhoNaoSalvo =
    gravando || audiosGravados.length > 0 || fotosArquivos.length > 0 || fotosRemovidasIds.length > 0 || audiosRemovidosIds.length > 0;

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

      {leitura.status !== "publicada" && momentos.length === 0 && (
        <p className="admin-momento-form__erro admin-builder__erro">
          ⚠ Ainda não há nenhum bloco salvo — grave o áudio ou tire a foto abaixo e clique em
          &ldquo;Adicionar bloco&rdquo; antes de publicar. O botão &ldquo;Publicar&rdquo; só libera depois disso.
        </p>
      )}

      <p className="admin-energia__salvo admin-energia__salvo--salvo">✓ Salvo</p>

      {erroEnvio && <p className="admin-momento-form__erro admin-builder__erro">⚠ {erroEnvio}</p>}

      <h2 className="admin-builder__subtitulo">Blocos ({momentos.length})</h2>
      <ol className="admin-builder__momentos">
        {momentos.map((momento) => (
          <li key={momento.id} className={`admin-momento ${editandoId === momento.id ? "admin-momento--editando" : ""}`}>
            <span className="admin-momento__ordem">{String(momento.ordem).padStart(2, "0")}</span>
            <div className="admin-momento__midia">
              {momento.audios.length > 0 && <span>🎙 {momento.audios.length} áudio(s)</span>}
              {momento.fotos.length > 0 && <span>🖼 {momento.fotos.length} foto(s)</span>}
              {momento.audios.length === 0 && momento.fotos.length === 0 && <span>Bloco vazio</span>}
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
            ? "Remova o que não quiser ou grave/tire mais mídia para este bloco."
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
              <>
                {!pausado ? (
                  <button type="button" className="button button--outline button--small" onClick={pausarGravacao}>
                    ⏸ Pausar
                  </button>
                ) : (
                  <button type="button" className="button button--outline button--small" onClick={retomarGravacao}>
                    ▶ Continuar
                  </button>
                )}
                <button type="button" className="button button--coral button--small admin-gravar__ativo" onClick={pararGravacao}>
                  ⏹ Parar gravação
                </button>
              </>
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
            <button
              type="button"
              className="button button--outline button--small"
              onClick={() => document.getElementById("input-galeria")?.click()}
            >
              🖼 Anexar foto
            </button>
            <input
              id="input-camera"
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => {
                const novaFoto = e.target.files?.[0];
                e.target.value = "";
                if (novaFoto) setFotoEmEdicao(novaFoto);
              }}
            />
            <input
              id="input-galeria"
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const novaFoto = e.target.files?.[0];
                e.target.value = "";
                if (novaFoto) setFotoEmEdicao(novaFoto);
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

      {fotoEmEdicao && (
        <FotoEditor
          foto={fotoEmEdicao}
          onCancelar={() => setFotoEmEdicao(null)}
          onConfirmar={async (arquivoEditado) => {
            const comprimida = await comprimirFoto(arquivoEditado);
            setFotosArquivos((atual) => [...atual, comprimida]);
            setFotoEmEdicao(null);
          }}
        />
      )}
    </div>
  );
}
