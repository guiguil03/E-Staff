"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import CalendarMonthView, { type CalendarEvent } from "@/components/ui/CalendarMonthView";
import { useRequireRole } from "@/lib/useRequireRole";
import { apiGet, ApiError } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

interface SeanceApi {
  groupeCle: string;
  groupeLabel: string;
  numero: number;
  startAt: string;
  dureeMinutes: number;
  objectifs: string | null;
}

function formateurHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-formateur-matricule": matricule } : {};
}

// Calendrier de toutes les classes virtuelles planifiées, tous groupes —
// pour suivre le rythme des séances d'un coup d'œil. Clic sur une séance →
// Planning (là où l'horaire se modifie), pas la page de visio elle-même
// (qui n'est utile que dans la fenêtre de rejoin).
export default function CalendrierDashboard() {
  const checked = useRequireRole("formateur");
  const [seances, setSeances] = useState<SeanceApi[] | "loading" | "erreur">("loading");

  useEffect(() => {
    if (!checked) return;
    apiGet<SeanceApi[]>("/seances", formateurHeaders())
      .then(setSeances)
      .catch((err) => setSeances(err instanceof ApiError ? [] : "erreur"));
  }, [checked]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <p className="font-sans text-sm text-white/50">Chargement...</p>
      </div>
    );
  }

  const events: CalendarEvent[] =
    Array.isArray(seances)
      ? seances.map((s) => ({
          id: `${s.groupeCle}-${s.numero}`,
          date: new Date(s.startAt),
          label: `${s.groupeLabel} — n°${s.numero}`,
          href: `/compte/formateur/planning?groupe=${s.groupeCle}&seance=${s.numero}`,
        }))
      : [];

  return (
    <div className="min-h-screen bg-obsidian px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/compte/formateur"
          className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
        >
          ← Retour au cockpit
        </Link>

        <Reveal>
          <h1 className="mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
            Calendrier des classes virtuelles
          </h1>
        </Reveal>

        <Reveal delay={40}>
          <div className="mt-6 rounded border border-white/10 bg-obsidianCard p-6">
            {seances === "loading" && (
              <p className="font-sans text-sm text-white/50">Chargement...</p>
            )}
            {seances === "erreur" && (
              <p className="font-sans text-sm text-white/50">
                Impossible de charger le calendrier pour le moment.
              </p>
            )}
            {Array.isArray(seances) && <CalendarMonthView events={events} />}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
