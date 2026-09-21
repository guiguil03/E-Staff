"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { apiGet } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

interface ACorrigerItem {
  id: string;
  apprenantPrenom: string;
  apprenantNom: string;
  competence: string;
  soumisAt: string | null;
}

function formateurHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-formateur-matricule": matricule } : {};
}

function fmtSoumis(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Résumé de la file de correction, avec lien vers la page dédiée
// /compte/formateur/corriger (plutôt qu'un panneau embarqué — pages
// dédiées pour tout ce qui a un contenu conséquent, cf. Compte Apprenant).
// Branché sur /notations/a-corriger depuis le 2026-09-22 — affichait avant
// une file fictive (exampleData.ts), jamais la vraie file d'attente.
export default function GradingQueueSummaryCard() {
  const [items, setItems] = useState<ACorrigerItem[]>([]);

  useEffect(() => {
    apiGet<ACorrigerItem[]>("/notations/a-corriger", formateurHeaders())
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const preview = items.slice(0, 3);

  return (
    <Reveal className="h-full">
      <div className="flex h-full flex-col rounded border border-white/10 bg-obsidianCard p-6">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-base font-semibold text-white">
            Évaluer &amp; Corriger
          </h3>
          <span className="font-mono text-xs text-white/50">{items.length} en attente</span>
        </div>

        <ul className="mt-4 space-y-2">
          {preview.map((item) => (
            <li
              key={item.id}
              className="rounded border border-white/10 bg-obsidian px-3 py-2"
            >
              <p className="font-sans text-sm text-white">
                {item.apprenantPrenom} {item.apprenantNom} — {item.competence}
              </p>
              <p className="font-mono text-[11px] text-white/40">{fmtSoumis(item.soumisAt)}</p>
            </li>
          ))}
          {items.length === 0 && (
            <li className="font-sans text-sm text-white/40">Aucun rendu en attente.</li>
          )}
        </ul>

        <Link
          href="/compte/formateur/corriger"
          className="mt-4 inline-flex items-center gap-1.5 font-sans text-sm font-medium text-accent hover:underline"
        >
          Accéder à la correction →
        </Link>
      </div>
    </Reveal>
  );
}
