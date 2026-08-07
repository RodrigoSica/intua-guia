"use client";

import { useRef, useState } from "react";

export type EnergiaAudio = { id: string; secaoId: string | null; ordem: number; r2Key: string };

type Props = {
  energiaId: string;
  secaoId?: string | null;
  audios: EnergiaAudio[];
  onAdicionar: (audio: EnergiaAudio) => void;
  onRemover: (id: string) => void;
  compacto?: boolean;
};

export default function AdminEnergiaGravador({
  energiaId,
  secaoId = null,
  audios,
  onAdicionar,
  onRemover,
  compacto = false,
}: Props) {
  const [gravando, setGravando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const gravadorRef = useRef<MediaRecorder | null>(null);
  const partesRef = useRef<Blob[]>([]);

  async function iniciar() {
    setErro("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const gravador = new MediaRecorder(stream);
      partesRef.current = [];
      gravador.ondataavailable = (evento) => partesRef.current.push(evento.data);
      gravador.start();
      gravadorRef.current = gravador;
      setGravando(true);
    } catch {
      setErro("Não foi possível acessar o microfone. Verifique a permissão do navegador.");
    }
  }

  async function parar() {
    const gravador = gravadorRef.current;
    if (!gravador || gravador.state === "inactive") return;
    setEnviando(true);
    setErro("");
    await new Promise<void>((resolve) => {
      gravador.onstop = async () => {
        gravador.stream.getTracks().forEach((faixa) => faixa.stop());
        const audio = new Blob(partesRef.current, { type: "audio/webm" });
        try {
          const form = new FormData();
          form.append("audio", audio, "gravacao.webm");
          if (secaoId) form.append("secaoId", secaoId);
          const resposta = await fetch(`/api/admin/energias/${energiaId}/audios`, { method: "POST", body: form });
          const dados = await resposta.json();
          if (!resposta.ok) throw new Error(dados.error || "Não foi possível guardar o áudio.");
          onAdicionar(dados.audio);
        } catch (error) {
          setErro(error instanceof Error ? error.message : "Não foi possível guardar o áudio.");
        } finally {
          setEnviando(false);
          resolve();
        }
      };
      gravador.stop();
    });
    setGravando(false);
  }

  async function remover(audio: EnergiaAudio) {
    setErro("");
    try {
      const resposta = await fetch(`/api/admin/energias/${energiaId}/audios/${audio.id}`, { method: "DELETE" });
      if (!resposta.ok) throw new Error("Não foi possível remover o áudio.");
      onRemover(audio.id);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível remover o áudio.");
    }
  }

  return (
    <div className={`admin-energia-gravador${compacto ? " admin-energia-gravador--compacto" : ""}`}>
      <div className="admin-gravar">
        {!gravando ? (
          <button type="button" className="button button--outline button--small" onClick={iniciar} disabled={enviando}>
            🎙 {enviando ? "Salvando áudio..." : "Gravar áudio"}
          </button>
        ) : (
          <button type="button" className="button button--coral button--small admin-gravar__ativo" onClick={parar}>
            ⏹ Parar gravação
          </button>
        )}
      </div>
      {audios.length > 0 && (
        <ul className="admin-midia-lista admin-midia-lista--existente">
          {audios.map((audio, indice) => (
            <li key={audio.id}>
              <span className="admin-energia-gravador__indice">Áudio {indice + 1}</span>
              <audio controls preload="none" src={`/midia/${audio.r2Key}`} />
              <button type="button" onClick={() => remover(audio)} aria-label={`Remover áudio ${indice + 1}`}>×</button>
            </li>
          ))}
        </ul>
      )}
      {erro && <p className="admin-momento-form__erro">⚠ {erro}</p>}
    </div>
  );
}
