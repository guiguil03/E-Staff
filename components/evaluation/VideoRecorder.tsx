"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Button from "@/components/ui/Button";

const MAX_FILE_BYTES = 300 * 1024 * 1024; // 300 Mo, cohérent avec la limite backend

interface VideoRecorderProps {
  onRecorded: (blob: Blob, filename: string) => void;
  maxSeconds: number;
  disabled?: boolean;
}

type Mode = "choice" | "record" | "upload";
type RecordStatus = "idle" | "recording" | "recorded" | "error";

// Deux façons de fournir la vidéo : filmer directement (webcam + micro via
// MediaRecorder, même principe qu'AudioRecorder) ou envoyer un fichier déjà
// enregistré. Le candidat choisit — utile si sa caméra/micro navigateur pose
// problème, ou s'il préfère une prise plus soignée faite en amont.
export default function VideoRecorder({ onRecorded, maxSeconds, disabled }: VideoRecorderProps) {
  const [mode, setMode] = useState<Mode>("choice");
  const [status, setStatus] = useState<RecordStatus>("idle");
  const [seconds, setSeconds] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const livePreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const filenameRef = useRef<string>("enregistrement.webm");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (livePreviewRef.current) {
        livePreviewRef.current.srcObject = stream;
      }
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        blobRef.current = blob;
        filenameRef.current = "enregistrement.webm";
        setVideoUrl(URL.createObjectURL(blob));
        setStatus("recorded");
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setStatus("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= maxSeconds) {
            stopRecording();
            return maxSeconds;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      setStatus("error");
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  }

  function reset() {
    setVideoUrl(null);
    blobRef.current = null;
    setFileError(null);
    setStatus("idle");
  }

  function confirm() {
    if (blobRef.current) onRecorded(blobRef.current, filenameRef.current);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setFileError("Merci de choisir un fichier vidéo.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError("Le fichier dépasse la taille maximale autorisée (300 Mo).");
      return;
    }
    setFileError(null);
    blobRef.current = file;
    filenameRef.current = file.name;
    setVideoUrl(URL.createObjectURL(file));
    setStatus("recorded");
  }

  function changeMethod() {
    reset();
    setMode("choice");
  }

  if (mode === "choice") {
    return (
      <div className="rounded border border-white/10 bg-obsidian p-4">
        <p className="mb-4 font-sans text-sm text-white/70">
          Choisissez comment fournir votre vidéo pour cette tâche.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="dark" onClick={() => setMode("record")} disabled={disabled}>
            Filmer avec ma caméra
          </Button>
          <Button type="button" variant="ghostDark" onClick={() => setMode("upload")} disabled={disabled}>
            Envoyer un fichier vidéo
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "upload") {
    return (
      <div className="rounded border border-white/10 bg-obsidian p-4">
        {status !== "recorded" ? (
          <>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              disabled={disabled}
              className="block w-full text-sm text-white/70 file:mr-4 file:rounded file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-obsidian"
            />
            {fileError && <p className="mt-2 text-sm text-accent">{fileError}</p>}
          </>
        ) : (
          videoUrl && (
            <div className="space-y-3">
              <video controls src={videoUrl} className="w-full rounded" />
              <div className="flex gap-3">
                <Button type="button" variant="dark" onClick={confirm} disabled={disabled}>
                  Valider cette vidéo
                </Button>
                <Button type="button" variant="ghostDark" onClick={reset}>
                  Choisir un autre fichier
                </Button>
              </div>
            </div>
          )
        )}
        <button
          type="button"
          onClick={changeMethod}
          className="mt-3 font-sans text-xs text-white/50 underline"
        >
          Changer de méthode
        </button>
      </div>
    );
  }

  return (
    <div className="rounded border border-white/10 bg-obsidian p-4">
      {status === "idle" && (
        <div className="space-y-3">
          <Button type="button" variant="ghostDark" onClick={startRecording} disabled={disabled}>
            Démarrer l&apos;enregistrement
          </Button>
        </div>
      )}

      {status === "recording" && (
        <div className="space-y-3">
          <video ref={livePreviewRef} autoPlay muted playsInline className="w-full rounded" />
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            <p className="font-mono text-sm text-white/80">
              {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")} /
              {Math.floor(maxSeconds / 60)}:{String(maxSeconds % 60).padStart(2, "0")}
            </p>
            <Button type="button" variant="dark" onClick={stopRecording}>
              Arrêter
            </Button>
          </div>
        </div>
      )}

      {status === "recorded" && videoUrl && (
        <div className="space-y-3">
          <video controls src={videoUrl} className="w-full rounded" />
          <div className="flex gap-3">
            <Button type="button" variant="dark" onClick={confirm} disabled={disabled}>
              Valider cette vidéo
            </Button>
            <Button type="button" variant="ghostDark" onClick={reset}>
              Réenregistrer
            </Button>
          </div>
        </div>
      )}

      {status === "error" && (
        <p className="font-sans text-sm text-accent">
          Impossible d&apos;accéder à la caméra ou au micro. Vérifiez les
          autorisations de votre navigateur, ou envoyez un fichier vidéo à la
          place.
        </p>
      )}

      {status !== "recorded" && (
        <button
          type="button"
          onClick={changeMethod}
          className="mt-3 font-sans text-xs text-white/50 underline"
        >
          Changer de méthode
        </button>
      )}
    </div>
  );
}
