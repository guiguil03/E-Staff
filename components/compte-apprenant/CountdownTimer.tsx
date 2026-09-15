"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  targetIso: string;
}

function splitDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
}

// Compte à rebours vivant vers la prochaine séance réellement programmée
// (Seance.startAt) — recalculé à chaque montage à partir de la vraie date
// cible, pas d'un décalage figé.
export default function CountdownTimer({ targetIso }: CountdownTimerProps) {
  const [target] = useState(() => new Date(targetIso).getTime());
  const [remaining, setRemaining] = useState(() => target - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRemaining(target - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  const { hours, minutes, seconds } = splitDuration(remaining);

  return (
    <div className="flex justify-center gap-2" aria-label="Temps restant avant la prochaine séance">
      {[
        { value: hours, unit: "h" },
        { value: minutes, unit: "m" },
        { value: seconds, unit: "s" },
      ].map((block) => (
        <div
          key={block.unit}
          className="flex min-w-[56px] flex-col items-center rounded border border-white/10 bg-obsidian px-3 py-2"
        >
          <span className="font-display text-xl font-bold text-white">
            {String(block.value).padStart(2, "0")}
          </span>
          <span className="font-mono text-[10px] uppercase text-white/40">{block.unit}</span>
        </div>
      ))}
    </div>
  );
}
