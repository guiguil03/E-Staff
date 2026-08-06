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

// Calendrier des classes virtuelles du groupe de l'apprenant. Chaque séance
// renvoie vers /classe-virtuelle, qui résout automatiquement la prochaine
// séance active — pas une page par séance dédiée pour l'instant.
export default function CalendrierDashboard() {
  const checked = useRequireRole("apprenant");
  const [seances, setSeances] = useState<SeanceApi[] | "loading" | "erreur">("loading");

  useEffect(() => {
    if (!checked) return;
    const matricule = sessionStorage.getItem(ACCOUNT_MATRICULE_KEY);
    if (!matricule) {
      setSeances("erreur");
      return;
    }
    apiGet<SeanceApi[]>(`/apprenants/${matricule}/seances`)
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
          label: `Séance n°${s.numero}`,
          href: "/compte/apprenant/classe-virtuelle",
        }))
      : [];

  return (
    <div className="min-h-screen bg-obsidian px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/compte/apprenant"
          className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
        >
          ← Retour au tableau de bord
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

        {Array.isArray(seances) && seances.length > 0 && (
          <Reveal delay={80}>
            <div className="mt-6 rounded border border-white/10 bg-obsidianCard p-6">
              <h3 className="font-display text-base font-semibold text-white">
                Détail des séances
              </h3>
              <div className="mt-4 space-y-3">
                {seances.map((s) => (
                  <div
                    key={`${s.groupeCle}-${s.numero}`}
                    className="rounded border border-white/10 bg-obsidian p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-sans text-sm font-semibold text-white">
                        Séance n°{s.numero}
                      </p>
                      <p className="font-mono text-xs text-accent">
                        {new Date(s.startAt).toLocaleString("fr-FR", {
                          dateStyle: "long",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/40">
                      Durée : {s.dureeMinutes} min
                    </p>
                    <p className="mt-2 font-sans text-sm text-white/70">
                      {s.objectifs ?? "Thème à venir — le formateur n'a pas encore précisé les objectifs."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
