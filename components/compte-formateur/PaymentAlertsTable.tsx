"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { APPRENANTS } from "./exampleData";

type Statut = "vert" | "orange" | "rouge";

interface PaymentAlertsTableProps {
  onSelectApprenant: (id: string) => void;
}

function computeStatut(echeanceIso: string): { statut: Statut; daysUntil: number } {
  const daysUntil = Math.ceil(
    (new Date(echeanceIso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const statut: Statut = daysUntil < 0 ? "rouge" : daysUntil <= 7 ? "orange" : "vert";
  return { statut, daysUntil };
}

// Pas de rouge dans la palette e-Staf — le teal fait office de second
// signal d'alerte, comme ailleurs dans l'app (assiduité, radar, etc.).
const STATUT_STYLES: Record<
  Statut,
  { border: string; text: string; bg: string; action: string }
> = {
  rouge: { border: "border-teal", text: "text-teal", bg: "bg-teal/10", action: "Bloquer l'accès" },
  orange: {
    border: "border-accent",
    text: "text-accent",
    bg: "bg-accent/10",
    action: "Envoyer un rappel",
  },
  vert: { border: "border-success", text: "text-success", bg: "bg-success/10", action: "" },
};

// Widget compact "Casiers Apprenants" : un petit rectangle à menu déroulant
// (plutôt qu'un grand tableau toujours ouvert) — l'en-tête affiche juste le
// nombre d'apprenants par statut (rouge/orange/vert), et on ouvre le détail
// pour consulter le casier d'un apprenant au cas par cas.
export default function PaymentAlertsTable({ onSelectApprenant }: PaymentAlertsTableProps) {
  const [showAll, setShowAll] = useState(false);
  const [actioned, setActioned] = useState<Set<string>>(new Set());

  const rows = APPRENANTS.map((a) => ({
    apprenant: a,
    ...computeStatut(a.echeanceRenouvellement),
  })).sort((a, b) => a.daysUntil - b.daysUntil);

  const counts = {
    rouge: rows.filter((r) => r.statut === "rouge").length,
    orange: rows.filter((r) => r.statut === "orange").length,
    vert: rows.filter((r) => r.statut === "vert").length,
  };
  const atRisk = rows.filter((r) => r.statut !== "vert");
  const visible = showAll ? rows : atRisk;

  function markActioned(id: string) {
    setActioned((prev) => new Set(prev).add(id));
  }

  return (
    <Reveal>
      <details className="group rounded border border-white/10 bg-obsidianCard">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 [&::-webkit-details-marker]:hidden">
          <div>
            <h3 className="font-display text-sm font-semibold text-white">
              Casiers Apprenants
            </h3>
            <p className="mt-0.5 font-mono text-[11px] text-white/40">
              Paiements &amp; renouvellements
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2 py-0.5 font-mono text-xs ${STATUT_STYLES.rouge.border} ${STATUT_STYLES.rouge.text} ${STATUT_STYLES.rouge.bg}`}
            >
              {counts.rouge}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 font-mono text-xs ${STATUT_STYLES.orange.border} ${STATUT_STYLES.orange.text} ${STATUT_STYLES.orange.bg}`}
            >
              {counts.orange}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 font-mono text-xs ${STATUT_STYLES.vert.border} ${STATUT_STYLES.vert.text} ${STATUT_STYLES.vert.bg}`}
            >
              {counts.vert}
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              className="ml-1 text-white/40 transition-transform group-open:rotate-180"
            >
              <path d="M2 5 L7 10 L12 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </summary>

        <div className="border-t border-white/10 p-4">
          <div className="max-h-72 overflow-y-auto overflow-x-auto">
            <table className="w-full min-w-[480px] font-sans text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-white/40">
                  <th className="py-2 pr-2 font-mono font-normal">Apprenant</th>
                  <th className="py-2 pr-2 font-mono font-normal">Groupe</th>
                  <th className="py-2 pr-2 font-mono font-normal">Échéance</th>
                  <th className="py-2 pr-2 font-mono font-normal">Statut</th>
                  <th className="py-2 font-mono font-normal text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(({ apprenant, statut, daysUntil }) => {
                  const style = STATUT_STYLES[statut];
                  const done = actioned.has(apprenant.id);
                  return (
                    <tr key={apprenant.id} className="border-b border-white/5">
                      <td className="py-2 pr-2">
                        <button
                          onClick={() => onSelectApprenant(apprenant.id)}
                          className="text-white transition-colors hover:text-accent"
                        >
                          {apprenant.firstName} {apprenant.lastName}
                        </button>
                      </td>
                      <td className="py-2 pr-2 text-white/70">{apprenant.groupe}</td>
                      <td className="py-2 pr-2 text-white/70">
                        {new Date(apprenant.echeanceRenouvellement).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-2 pr-2">
                        <span
                          className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] ${style.border} ${style.text} ${style.bg}`}
                        >
                          {statut === "rouge"
                            ? `En retard (${Math.abs(daysUntil)} j)`
                            : statut === "orange"
                              ? `Dans ${daysUntil} j`
                              : "À jour"}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        {statut !== "vert" && (
                          <Button
                            variant="ghostDark"
                            disabled={done}
                            onClick={() => markActioned(apprenant.id)}
                          >
                            {done ? "Fait" : style.action}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="mt-3 font-sans text-xs text-accent hover:underline"
            >
              Voir tous les apprenants ({rows.length})
            </button>
          )}
        </div>
      </details>
    </Reveal>
  );
}
