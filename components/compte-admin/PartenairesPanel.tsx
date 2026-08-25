"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet, apiPut } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface Partenaire {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  activityType: string;
  clientCount: string;
  status: string;
  createdAt: string;
}

const STATUTS = ["nouveau", "contacte", "actif"] as const;

const STATUT_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  actif: "Actif",
};

// Répertoire des partenaires / apporteurs d'affaires — la table Connecteur
// existait déjà (formulaire "Devenir Connecteur e-Staf") mais n'avait aucune
// vue de gestion côté RH ; ce panneau ajoute la première (liste + mise à
// jour de statut). Pas encore de suivi de commissions réel (aucun modèle de
// deal/commission en base) — volontairement absent plutôt qu'inventé.
export default function PartenairesPanel() {
  const [rows, setRows] = useState<Partenaire[] | "loading" | "erreur">("loading");
  const [savingId, setSavingId] = useState<string | null>(null);

  function refresh() {
    setRows("loading");
    apiGet<Partenaire[]>("/rh/partenaires", adminHeaders())
      .then(setRows)
      .catch(() => setRows("erreur"));
  }

  useEffect(refresh, []);

  async function changeStatut(id: string, status: string) {
    setSavingId(id);
    try {
      await apiPut(`/rh/partenaires/${id}/statut`, { status }, adminHeaders());
      refresh();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <h3 className="font-display text-base font-semibold text-white">
          Partenaires &amp; apporteurs d&apos;affaires
        </h3>
        <p className="mt-1 font-sans text-xs text-white/50">
          Répertoire des candidatures Connecteur — statut mis à jour manuellement par la RH.
        </p>

        {rows === "loading" && (
          <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>
        )}
        {rows === "erreur" && (
          <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>
        )}
        {Array.isArray(rows) && rows.length === 0 && (
          <p className="mt-4 font-sans text-sm text-white/50">Aucun partenaire pour l&apos;instant.</p>
        )}

        {Array.isArray(rows) && rows.length > 0 && (
          <div className="mt-4 space-y-2">
            {rows.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded border border-white/10 bg-obsidian px-4 py-3"
              >
                <div>
                  <p className="font-sans text-sm text-white">
                    {p.firstName} {p.lastName}
                  </p>
                  <p className="font-mono text-[11px] text-white/40">
                    {p.activityType} · {p.clientCount} clients · {p.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {STATUTS.map((s) => (
                    <button
                      key={s}
                      onClick={() => changeStatut(p.id, s)}
                      disabled={savingId === p.id}
                      className={`rounded border px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest transition-colors disabled:opacity-50 ${
                        p.status === s
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-white/15 text-white/50 hover:border-white/30"
                      }`}
                    >
                      {STATUT_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Reveal>
  );
}
