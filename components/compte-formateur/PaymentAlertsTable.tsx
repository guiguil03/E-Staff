"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { APPRENANTS } from "./exampleData";

type Statut = "vert" | "orange" | "rouge";

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

// Tableau de contrôle "Alertes Paiements & Casiers Apprenants" — rouge
// (échéance dépassée) déclenche le blocage d'accès au casier, orange
// (échéance dans la semaine) déclenche un rappel de renouvellement.
// Actions en état local (pas de vrai contrôle d'accès/messagerie backend
// pour l'instant) ; liste capée + repliable pour ne pas déséquilibrer le
// cockpit (leçon du Vivier C1).
export default function PaymentAlertsTable() {
  const [showAll, setShowAll] = useState(false);
  const [actioned, setActioned] = useState<Set<string>>(new Set());

  const rows = APPRENANTS.map((a) => ({
    apprenant: a,
    ...computeStatut(a.echeanceRenouvellement),
  })).sort((a, b) => a.daysUntil - b.daysUntil);

  const atRisk = rows.filter((r) => r.statut !== "vert");
  const visible = showAll ? rows : atRisk;

  function markActioned(id: string) {
    setActioned((prev) => new Set(prev).add(id));
  }

  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-base font-semibold text-white">
            Alertes Paiements &amp; Casiers Apprenants
          </h3>
          <span className="font-mono text-xs text-white/50">
            {atRisk.length} à traiter
          </span>
        </div>

        <div className="mt-4 max-h-72 overflow-y-auto overflow-x-auto">
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
                    <td className="py-2 pr-2 text-white">
                      {apprenant.firstName} {apprenant.lastName}
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
    </Reveal>
  );
}
