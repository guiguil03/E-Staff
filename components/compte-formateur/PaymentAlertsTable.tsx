"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiGet, apiPut, ApiError } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";
import { apprenantIdFromMatricule } from "./exampleData";

type Statut = "vert" | "orange" | "rouge" | "non_defini";

interface PaymentAlertsTableProps {
  onSelectApprenant: (id: string) => void;
}

interface ApprenantPaiementApi {
  matricule: string;
  prenom: string;
  nom: string;
  groupeCle: string;
  abonnementExpireAt: string | null;
}

function formateurHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-formateur-matricule": matricule } : {};
}

function computeStatut(echeanceIso: string | null): { statut: Statut; daysUntil: number | null } {
  if (!echeanceIso) return { statut: "non_defini", daysUntil: null };
  const daysUntil = Math.ceil(
    (new Date(echeanceIso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const statut: Statut = daysUntil < 0 ? "rouge" : daysUntil <= 7 ? "orange" : "vert";
  return { statut, daysUntil };
}

// Pas de rouge dans la palette e-Staf — le teal fait office de second
// signal d'alerte, comme ailleurs dans l'app (assiduité, radar, etc.).
// "non_defini" : aucune échéance encore fixée pour cet apprenant (champ
// abonnementExpireAt nul) — statut neutre, pas assimilé à un retard.
const STATUT_STYLES: Record<Statut, { border: string; text: string; bg: string }> = {
  rouge: { border: "border-teal", text: "text-teal", bg: "bg-teal/10" },
  orange: { border: "border-accent", text: "text-accent", bg: "bg-accent/10" },
  vert: { border: "border-success", text: "text-success", bg: "bg-success/10" },
  non_defini: { border: "border-white/20", text: "text-white/50", bg: "bg-white/5" },
};

// Widget compact "Casiers Apprenants" : un petit rectangle à menu déroulant
// (plutôt qu'un grand tableau toujours ouvert) — l'en-tête affiche juste le
// nombre d'apprenants par statut, et on ouvre le détail pour consulter le
// casier d'un apprenant au cas par cas. Branché sur le vrai champ
// Apprenant.abonnementExpireAt depuis 2026-08-24 (abonnement à date fixe,
// saisie/mise à jour manuelle par le formateur ici même — voir
// /cockpit/paiements et PUT /cockpit/apprenants/:matricule/abonnement).
export default function PaymentAlertsTable({ onSelectApprenant }: PaymentAlertsTableProps) {
  const [showAll, setShowAll] = useState(false);
  const [apprenants, setApprenants] = useState<ApprenantPaiementApi[] | "loading" | "erreur">(
    "loading"
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [dateInput, setDateInput] = useState("");
  const [saving, setSaving] = useState(false);

  function refresh() {
    setApprenants("loading");
    apiGet<ApprenantPaiementApi[]>("/cockpit/paiements", formateurHeaders())
      .then(setApprenants)
      .catch(() => setApprenants("erreur"));
  }

  useEffect(refresh, []);

  async function saveEcheance(matricule: string) {
    if (!dateInput) return;
    setSaving(true);
    try {
      await apiPut(
        `/cockpit/apprenants/${matricule}/abonnement`,
        { expireAt: new Date(dateInput).toISOString() },
        formateurHeaders()
      );
      setEditing(null);
      setDateInput("");
      refresh();
    } catch (err) {
      // Erreur affichée simplement — pas de canal d'erreur dédié pour ce
      // petit widget, cohérent avec le reste du cockpit.
      alert(err instanceof ApiError ? err.message : "Erreur — réessayer.");
    } finally {
      setSaving(false);
    }
  }

  if (apprenants === "loading" || apprenants === "erreur") {
    return (
      <Reveal>
        <div className="rounded border border-white/10 bg-obsidianCard p-4">
          <h3 className="font-display text-sm font-semibold text-white">Casiers Apprenants</h3>
          <p className="mt-2 font-sans text-xs text-white/50">
            {apprenants === "loading" ? "Chargement..." : "Impossible de charger les casiers pour le moment."}
          </p>
        </div>
      </Reveal>
    );
  }

  const rows = apprenants
    .map((a) => ({ apprenant: a, ...computeStatut(a.abonnementExpireAt) }))
    .sort((a, b) => (a.daysUntil ?? Infinity) - (b.daysUntil ?? Infinity));

  const counts = {
    rouge: rows.filter((r) => r.statut === "rouge").length,
    orange: rows.filter((r) => r.statut === "orange").length,
    vert: rows.filter((r) => r.statut === "vert").length,
    non_defini: rows.filter((r) => r.statut === "non_defini").length,
  };
  const atRisk = rows.filter((r) => r.statut !== "vert");
  const visible = showAll ? rows : atRisk;

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
            <span
              className={`rounded-full border px-2 py-0.5 font-mono text-xs ${STATUT_STYLES.non_defini.border} ${STATUT_STYLES.non_defini.text} ${STATUT_STYLES.non_defini.bg}`}
            >
              {counts.non_defini}
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
                  const isEditing = editing === apprenant.matricule;
                  return (
                    <tr key={apprenant.matricule} className="border-b border-white/5">
                      <td className="py-2 pr-2">
                        <button
                          onClick={() => onSelectApprenant(apprenantIdFromMatricule(apprenant.matricule))}
                          className="text-white transition-colors hover:text-accent"
                        >
                          {apprenant.prenom} {apprenant.nom}
                        </button>
                      </td>
                      <td className="py-2 pr-2 text-white/70">{apprenant.groupeCle}</td>
                      <td className="py-2 pr-2 text-white/70">
                        {apprenant.abonnementExpireAt
                          ? new Date(apprenant.abonnementExpireAt).toLocaleDateString("fr-FR")
                          : "—"}
                      </td>
                      <td className="py-2 pr-2">
                        <span
                          className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] ${style.border} ${style.text} ${style.bg}`}
                        >
                          {statut === "rouge"
                            ? `En retard (${Math.abs(daysUntil ?? 0)} j)`
                            : statut === "orange"
                              ? `Dans ${daysUntil} j`
                              : statut === "non_defini"
                                ? "Non défini"
                                : "À jour"}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="date"
                              value={dateInput}
                              onChange={(e) => setDateInput(e.target.value)}
                              className="rounded border border-white/20 bg-obsidian px-2 py-1 font-sans text-xs text-white outline-none focus:border-accent"
                            />
                            <Button
                              variant="ghostDark"
                              disabled={!dateInput || saving}
                              onClick={() => saveEcheance(apprenant.matricule)}
                            >
                              Valider
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghostDark"
                            onClick={() => {
                              setEditing(apprenant.matricule);
                              setDateInput(
                                apprenant.abonnementExpireAt
                                  ? apprenant.abonnementExpireAt.slice(0, 10)
                                  : ""
                              );
                            }}
                          >
                            Renouveler
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
