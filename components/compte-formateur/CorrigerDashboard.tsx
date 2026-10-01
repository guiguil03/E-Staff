"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Reveal from "@/components/Reveal";
import { useRequireRole } from "@/lib/useRequireRole";
import { apiGet, apiPut, ApiError } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";
import { COMPETENCY_DEFS } from "./gradingGrids";
import {
  EXPRESSION_ORALE_CRITERIA,
  EXPRESSION_ORALE_MAX,
  EXPRESSION_ECRITE_CRITERIA,
  EXPRESSION_ECRITE_MAX,
  EXPRESSION_ECRITE_ANOMALIES,
} from "./gradingGrids";
import type { CompetencyEntry, GridCompetencyEntry } from "./planningGradesStore";
import DelfGrid from "./grids/DelfGrid";
import PostureGrid from "./grids/PostureGrid";
import DevoirPreview from "./DevoirPreview";

interface RenduItem {
  id: string;
  apprenantMatricule: string;
  apprenantPrenom: string;
  apprenantNom: string;
  groupeCle: string;
  groupeLabel: string;
  numero: number;
  competence: string;
  fileName: string | null;
  soumisAt: string | null;
  gradedAt: string | null;
  scoreOn20: number | null;
  gridData: { selections?: Record<string, number>; anomaly?: string; adjustments?: unknown } | null;
  commentaires: string | null;
}

type Onglet = "a-corriger" | "corriges";

function formateurHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-formateur-matricule": matricule } : {};
}

function toGridEntry(item: RenduItem): GridCompetencyEntry | undefined {
  if (!item.gridData) return undefined;
  return {
    kind: "grid",
    selections: (item.gridData.selections as Record<string, number | undefined>) ?? {},
    anomaly: item.gridData.anomaly as string | undefined,
    adjustments: item.gridData.adjustments as GridCompetencyEntry["adjustments"],
    comments: item.commentaires ?? "",
    scoreOn20: item.scoreOn20,
  };
}

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) : "";
}

// Page dédiée "Évaluer & Corriger" — file d'attente des devoirs déposés par
// les apprenants (voir Compte Apprenant > tableau des séances). Distinct du
// test d'admission avant compte (module /evaluation, backend séparé).
// Notation avec les mêmes grilles DELF que la notation de séance (Planning
// > Noter, voir gradingGrids.ts), dans la même table Notation.
//
// Depuis le 2026-09-25 : onglet « Historique » (les rendus notés ne
// disparaissent plus — relecture et correction de la note possibles),
// filtre par groupe, ouverture directe d'un rendu depuis Planning
// (?rendu=<id>), et enchaînement automatique sur le rendu suivant après
// chaque notation.
export default function CorrigerDashboard() {
  const checked = useRequireRole("formateur");
  const searchParams = useSearchParams();
  const [onglet, setOnglet] = useState<Onglet>("a-corriger");
  const [aCorriger, setACorriger] = useState<RenduItem[] | "loading" | "erreur">("loading");
  const [corriges, setCorriges] = useState<RenduItem[] | "loading" | "erreur">("loading");
  const [groupeFiltre, setGroupeFiltre] = useState<string>("tous");
  const [openId, setOpenId] = useState<string | null>(searchParams.get("rendu"));
  const [saveError, setSaveError] = useState<string | null>(null);

  function refresh() {
    return Promise.all([
      apiGet<RenduItem[]>("/notations/a-corriger", formateurHeaders())
        .then((data) => {
          setACorriger(data);
          return data;
        })
        .catch(() => {
          setACorriger("erreur");
          return [] as RenduItem[];
        }),
      apiGet<RenduItem[]>("/notations/corriges", formateurHeaders())
        .then((data) => {
          setCorriges(data);
          return data;
        })
        .catch(() => {
          setCorriges("erreur");
          return [] as RenduItem[];
        }),
    ]);
  }

  useEffect(() => {
    if (!checked) return;
    refresh().then(([file, historique]) => {
      // Rendu demandé depuis Planning : ouvre le bon onglet.
      const demande = searchParams.get("rendu");
      if (demande && !file.some((i) => i.id === demande) && historique.some((i) => i.id === demande)) {
        setOnglet("corriges");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked]);

  const liste = onglet === "a-corriger" ? aCorriger : corriges;
  const groupes = Array.from(
    new Map(
      [...(Array.isArray(aCorriger) ? aCorriger : []), ...(Array.isArray(corriges) ? corriges : [])].map(
        (i) => [i.groupeCle, i.groupeLabel]
      )
    )
  ).sort(([a], [b]) => a.localeCompare(b));
  const visibles = Array.isArray(liste)
    ? liste.filter((i) => groupeFiltre === "tous" || i.groupeCle === groupeFiltre)
    : [];
  const openItem =
    (Array.isArray(aCorriger) ? aCorriger.find((i) => i.id === openId) : undefined) ??
    (Array.isArray(corriges) ? corriges.find((i) => i.id === openId) : undefined);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <p className="font-sans text-sm text-white/50">Chargement...</p>
      </div>
    );
  }

  async function handleSave(entry: CompetencyEntry) {
    if (!openItem) return;
    setSaveError(null);
    const payload =
      entry.kind === "grid"
        ? {
            gridData: {
              selections: entry.selections,
              anomaly: entry.anomaly,
              adjustments: entry.adjustments,
            },
            commentaires: entry.comments,
            scoreOn20: entry.scoreOn20,
          }
        : { note: entry.note, scoreOn20: entry.scoreOn20 };

    try {
      await apiPut(
        `/notations/${openItem.groupeCle}/${openItem.numero}/${openItem.apprenantMatricule}/${openItem.competence}`,
        payload,
        formateurHeaders()
      );
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Enregistrement impossible — réessayez.");
      return;
    }

    const etaitACorriger = !openItem.gradedAt;
    const [file] = await refresh();
    // Enchaîne sur le rendu suivant de la file (même filtre de groupe) :
    // le formateur corrige d'une traite, sans revenir à la liste.
    if (etaitACorriger) {
      const suivant = file.find((i) => groupeFiltre === "tous" || i.groupeCle === groupeFiltre);
      setOpenId(suivant?.id ?? null);
    }
  }

  const competenceLabel = openItem
    ? COMPETENCY_DEFS.find((c) => c.key === openItem.competence)?.label
    : undefined;
  const nbACorriger = Array.isArray(aCorriger) ? aCorriger.length : null;

  return (
    <div className="min-h-screen bg-obsidian px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/compte/formateur"
          className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
        >
          ← Retour au cockpit
        </Link>

        <Reveal>
          <h1 className="mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
            Évaluer &amp; Corriger
          </h1>
          <p className="mt-1 font-sans text-sm text-white/60">
            {nbACorriger === null
              ? ""
              : nbACorriger === 0
                ? "Aucun rendu en attente"
                : `${nbACorriger} rendu${nbACorriger > 1 ? "s" : ""} en attente`}
          </p>
        </Reveal>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {(
              [
                ["a-corriger", `À corriger${nbACorriger !== null ? ` (${nbACorriger})` : ""}`],
                ["corriges", "Historique"],
              ] as [Onglet, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setOnglet(key)}
                className={`rounded border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors ${
                  onglet === key
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-white/15 text-white/60 hover:border-accent/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {groupes.length > 1 && (
            <select
              value={groupeFiltre}
              onChange={(e) => setGroupeFiltre(e.target.value)}
              className="rounded border border-white/20 bg-obsidian px-3 py-1.5 font-sans text-sm text-white outline-none focus:border-accent"
            >
              <option value="tous">Tous les groupes</option>
              {groupes.map(([cle, label]) => (
                <option key={cle} value={cle}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-[300px_1fr]">
          <Reveal>
            <div className="space-y-2">
              {liste === "loading" && (
                <p className="font-sans text-sm text-white/50">Chargement...</p>
              )}
              {liste === "erreur" && (
                <p className="font-sans text-sm text-white/50">Erreur de chargement.</p>
              )}
              {visibles.map((item) => {
                const label = COMPETENCY_DEFS.find((c) => c.key === item.competence)?.label;
                return (
                  <button
                    key={item.id}
                    onClick={() => setOpenId(item.id)}
                    className={`flex w-full items-center justify-between gap-2 rounded border px-3 py-2.5 text-left transition-colors ${
                      openId === item.id
                        ? "border-accent bg-obsidianCard"
                        : "border-white/10 bg-obsidianCard hover:border-accent/50"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-sans text-sm text-white">
                        {item.apprenantPrenom} {item.apprenantNom}
                      </span>
                      <span className="block truncate font-mono text-[11px] text-white/40">
                        {label} · {item.groupeLabel} n°{item.numero}
                      </span>
                    </span>
                    <span className="shrink-0 text-right font-mono text-[11px]">
                      {item.gradedAt ? (
                        <span className="text-accent">{item.scoreOn20}/20</span>
                      ) : (
                        <span className="text-white/40">{formatDate(item.soumisAt)}</span>
                      )}
                    </span>
                  </button>
                );
              })}
              {Array.isArray(liste) && visibles.length === 0 && (
                <p className="rounded border border-white/10 bg-obsidianCard p-4 font-sans text-sm text-white/50">
                  {onglet === "a-corriger"
                    ? "Tous les rendus ont été corrigés."
                    : "Aucun rendu corrigé pour l'instant."}
                </p>
              )}
            </div>
          </Reveal>

          <Reveal delay={60}>
            {openItem ? (
              <div className="rounded border border-accent/30 bg-obsidianCard p-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-sans text-sm font-semibold text-white">
                      {openItem.apprenantPrenom} {openItem.apprenantNom} —{" "}
                      <span className="text-white/60">{openItem.groupeLabel}</span>
                    </p>
                    <p className="font-sans text-xs text-white/60">
                      {competenceLabel} — Séance n°{openItem.numero}
                      {openItem.soumisAt && ` · déposé le ${formatDate(openItem.soumisAt)}`}
                    </p>
                  </div>
                  {openItem.gradedAt && (
                    <span className="rounded border border-accent/40 px-2 py-1 font-mono text-xs text-accent">
                      Noté {openItem.scoreOn20}/20 le {formatDate(openItem.gradedAt)}
                    </span>
                  )}
                </div>

                <DevoirPreview notationId={openItem.id} fileName={openItem.fileName} />

                {openItem.gradedAt && (
                  <p className="mt-4 font-sans text-xs text-white/50">
                    Vous pouvez modifier la grille ci-dessous et réenregistrer pour corriger la note.
                  </p>
                )}
                {saveError && <p className="mt-3 font-sans text-sm text-accent">{saveError}</p>}

                <div className="mt-5" key={`${openItem.id}-${openItem.gradedAt ?? "new"}`}>
                  {openItem.competence === "expression_orale" && (
                    <DelfGrid
                      criteria={EXPRESSION_ORALE_CRITERIA}
                      maxRaw={EXPRESSION_ORALE_MAX}
                      initialEntry={toGridEntry(openItem)}
                      onSave={handleSave}
                      onCancel={() => setOpenId(null)}
                    />
                  )}
                  {openItem.competence === "expression_ecrite" && (
                    <DelfGrid
                      criteria={EXPRESSION_ECRITE_CRITERIA}
                      maxRaw={EXPRESSION_ECRITE_MAX}
                      anomalies={EXPRESSION_ECRITE_ANOMALIES}
                      initialEntry={toGridEntry(openItem)}
                      onSave={handleSave}
                      onCancel={() => setOpenId(null)}
                    />
                  )}
                  {openItem.competence === "posture_eloquence" && (
                    <PostureGrid
                      initialEntry={toGridEntry(openItem)}
                      onSave={handleSave}
                      onCancel={() => setOpenId(null)}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[200px] items-center justify-center rounded border border-dashed border-white/10 p-10 text-center">
                <p className="font-sans text-sm text-white/50">
                  {onglet === "a-corriger" && nbACorriger === 0
                    ? "Rien à corriger pour le moment — vous recevez un e-mail à chaque nouveau rendu."
                    : "Sélectionnez un rendu à gauche."}
                </p>
              </div>
            )}
          </Reveal>
        </div>
      </div>
    </div>
  );
}
