"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";

const MAX_SECONDS = 120; // 2 minutes max, per cahier des charges (1 à 2 min)

interface AudioRecorderProps {
  onRecorded: (blob: Blob) => void;
  disabled?: boolean;
}

// Records a 1-2 minute answer via the browser MediaRecorder API. Recording
// stops automatically at MAX_SECONDS. The candidate can re-record before
// validating — validation is a separate explicit action (onRecorded is only
// called once they confirm).
export default function AudioRecorder({ onRecorded, disabled }: AudioRecorderProps) {
  const [status, setStatus] = useState<"idle" | "recording" | "recorded" | "error">(
    "idle"
  );
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        blobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        setStatus("recorded");
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setStatus("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) {
            stopRecording();
            return MAX_SECONDS;
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

  function reRecord() {
    setAudioUrl(null);
    blobRef.current = null;
    setStatus("idle");
  }

  function confirm() {
    if (blobRef.current) onRecorded(blobRef.current);
  }

  return (
    <div className="rounded border border-white/10 bg-obsidian p-4">
      {status === "idle" && (
        <Button type="button" variant="ghostDark" onClick={startRecording} disabled={disabled}>
          Démarrer l&apos;enregistrement
        </Button>
      )}

      {status === "recording" && (
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          <p className="font-mono text-sm text-white/80">
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")} /
            2:00
          </p>
          <Button type="button" variant="dark" onClick={stopRecording}>
            Arrêter
          </Button>
        </div>
      )}

      {status === "recorded" && audioUrl && (
        <div className="space-y-3">
          <audio controls src={audioUrl} className="w-full" />
          <div className="flex gap-3">
            <Button type="button" variant="dark" onClick={confirm} disabled={disabled}>
              Valider cette réponse
            </Button>
            <Button type="button" variant="ghostDark" onClick={reRecord}>
              Réenregistrer
            </Button>
          </div>
        </div>
      )}

      {status === "error" && (
        <p className="text-sm text-accent">
          Impossible d&apos;accéder au microphone. Vérifiez les autorisations de
          votre navigateur.
        </p>
      )}
    </div>
  );
}
