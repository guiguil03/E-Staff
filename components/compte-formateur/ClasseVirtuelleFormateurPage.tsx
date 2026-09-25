"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { useRequireRole } from "@/lib/useRequireRole";
import { apiGet } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";
import NotationCompetencesPanel from "./NotationCompetencesPanel";
import SupportsCoursCard from "./SupportsCoursCard";
import NotesFormateurPanel from "./NotesFormateurPanel";
import TableauBlanc from "@/components/classe-virtuelle/TableauBlanc";

interface ApprenantListApi {
  matricule: string;
  prenom: string;
  nom: string;
  groupeCle: string;
}

interface RoomStatus {
  groupeCle: string;
  numero: number;
  startAt: string | null;
  dureeMinutes: number;
  objectifs: string | null;
  withinJoinWindow: boolean;
  configured: boolean;
  roomUrl: string | null;
}

interface ClasseVirtuelleFormateurPageProps {
  groupeCle: string;
  numero: number;
}

function formateurHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-formateur-matricule": matricule } : {};
}

function formatRelative(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin <= 0) return "en cours";
  if (diffMin < 60) return `dans ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `dans ${diffH} h`;
  return `dans ${Math.round(diffH / 24)} j`;
}

// Page de lancement d'une classe virtuelle — pense d'abord "briefing"
// (horaire, objectifs, apprenants attendus, statut de la salle), l'iframe
// vidéo n'apparaît qu'après un clic explicite sur "Lancer" (client feedback
// 2026-08-07 : voir une page précise avec toutes les informations, pas
// juste être jeté dans l'appel).
export default function ClasseVirtuelleFormateurPage({
  groupeCle,
  numero,
}: ClasseVirtuelleFormateurPageProps) {
  const checked = useRequireRole("formateur");
  const [status, setStatus] = useState<RoomStatus | "loading" | "erreur">("loading");
  const [launched, setLaunched] = useState(false);
  // Panneau latéral pendant le cours : notation en direct ou supports.
  const [panneau, setPanneau] = useState<"noter" | "supports" | "notes" | "tableau" | null>("noter");
  const [apprenantNote, setApprenantNote] = useState<string | null>(null);
  const [apprenants, setApprenants] = useState<ApprenantListApi[]>([]);

  useEffect(() => {
    if (!checked) return;
    apiGet<RoomStatus>(`/seances/${groupeCle}/${numero}/room`, formateurHeaders())
      .then(setStatus)
      .catch(() => setStatus("erreur"));
    // Branché sur /cockpit/apprenants depuis le 2026-09-22 — affichait avant
    // 5 faux noms d'exampleData.ts comme "participants attendus", jamais le
    // vrai effectif du groupe.
    apiGet<ApprenantListApi[]>("/cockpit/apprenants", formateurHeaders())
      .then(setApprenants)
      .catch(() => setApprenants([]));
  }, [checked, groupeCle, numero]);

  if (!checked || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <p className="font-sans text-sm text-white/50">Chargement...</p>
      </div>
    );
  }

  if (launched && status !== "erreur" && status.withinJoinWindow && status.roomUrl) {
    const apprenantsDuGroupe = apprenants.filter((a) => a.groupeCle === groupeCle);
    return (
      <div className="flex h-screen flex-col bg-obsidian">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <p className="font-sans text-sm text-white/70">
            Groupe {groupeCle} — Séance n°{numero}
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPanneau((p) => (p ? null : "noter"))}
              className="font-mono text-xs uppercase tracking-widest text-white/60 hover:text-accent"
            >
              {panneau ? "Masquer le panneau" : "Outils du cours"}
            </button>
            <button
              onClick={() => setLaunched(false)}
              className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
            >
              ← Quitter
            </button>
          </div>
        </div>
        {/* La visio reste montée en permanence : ouvrir/fermer le panneau ou
            y noter ne recharge jamais l'iframe, donc ne coupe pas le cours
            (demande cliente du 2026-09-25 : noter et ajouter des supports
            « sans que la séance ne soit interrompue »). */}
        <div className="flex min-h-0 flex-1">
          <iframe
            src={status.roomUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="min-w-0 flex-1 border-0"
          />
          {panneau && (
            // Onglet Tableau : le panneau s'élargit (la visio rétrécit sans
            // être rechargée) pour laisser de la place au dessin.
            <aside
              className={`flex shrink-0 flex-col border-l border-white/10 bg-obsidianCard ${
                panneau === "tableau" ? "w-[62%]" : "w-full max-w-[420px]"
              }`}
            >
              <div className="flex border-b border-white/10">
                {(
                  [
                    ["noter", "Noter"],
                    ["supports", "Supports"],
                    ["notes", "Notes"],
                    ["tableau", "Tableau"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setPanneau(key)}
                    className={`flex-1 px-4 py-3 font-mono text-xs uppercase tracking-widest transition-colors ${
                      panneau === key ? "border-b-2 border-accent text-accent" : "text-white/50 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {panneau === "noter" && (
                  <>
                    <label className="block font-mono text-[11px] uppercase tracking-widest text-white/50">
                      Apprenant
                      <select
                        value={apprenantNote ?? ""}
                        onChange={(e) => setApprenantNote(e.target.value || null)}
                        className="mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm normal-case tracking-normal text-white outline-none focus:border-accent"
                      >
                        <option value="">— Choisir un apprenant —</option>
                        {apprenantsDuGroupe.map((a) => (
                          <option key={a.matricule} value={a.matricule}>
                            {a.prenom} {a.nom}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="mt-4">
                      {apprenantNote ? (
                        <NotationCompetencesPanel
                          key={apprenantNote}
                          groupe={groupeCle}
                          seance={numero}
                          matricule={apprenantNote}
                          compact
                        />
                      ) : (
                        <p className="font-sans text-sm text-white/50">
                          Choisissez un apprenant pour noter ses compétences pendant le cours — la visio
                          continue à gauche.
                        </p>
                      )}
                    </div>
                  </>
                )}
                {panneau === "notes" && (
                  <NotesFormateurPanel groupe={groupeCle} seance={numero} apprenants={apprenantsDuGroupe} />
                )}
                {panneau === "tableau" && (
                  <div className="h-full">
                    <TableauBlanc
                      mode="edition"
                      basePath={`/seances/${groupeCle}/${numero}/tableau`}
                      headers={formateurHeaders()}
                    />
                  </div>
                )}
                {panneau === "supports" && (
                  <>
                    <p className="font-sans text-xs text-white/60">
                      Les documents déposés « pour la séance n°{numero} » apparaissent aussitôt chez les
                      apprenants, à côté de leur visio.
                    </p>
                    <SupportsCoursCard groupeKey={groupeCle} seance={numero} />
                  </>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    );
  }

  const apprenantsGroupe = apprenants.filter((a) => a.groupeCle === groupeCle);

  return (
    <div className="min-h-screen bg-obsidian px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/compte/formateur/planning"
          className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
        >
          ← Retour au planning
        </Link>

        <Reveal>
          <h1 className="mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
            Groupe {groupeCle} — Séance n°{numero}
          </h1>
        </Reveal>

        {status === "erreur" || !status.startAt ? (
          <Reveal delay={40}>
            <div className="mt-6 rounded border border-dashed border-white/15 bg-obsidianCard p-6 text-center">
              <p className="font-sans text-sm text-white/60">
                Cette séance n&apos;est pas encore planifiée.
              </p>
              <Link
                href={`/compte/formateur/planning?groupe=${groupeCle}&seance=${numero}`}
                className="mt-3 inline-block font-mono text-xs uppercase tracking-widest text-accent hover:underline"
              >
                Planifier maintenant →
              </Link>
            </div>
          </Reveal>
        ) : (
          <>
            <Reveal delay={40}>
              <div className="mt-6 rounded border border-white/10 bg-obsidianCard p-6">
                <h3 className="font-display text-base font-semibold text-white">Informations</h3>
                <dl className="mt-3 space-y-2 font-sans text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-white/50">Horaire</dt>
                    <dd className="text-right text-white">
                      {new Date(status.startAt).toLocaleString("fr-FR", {
                        dateStyle: "long",
                        timeStyle: "short",
                      })}{" "}
                      <span className="text-accent">({formatRelative(status.startAt)})</span>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-white/50">Durée</dt>
                    <dd className="text-white">{status.dureeMinutes} min</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-white/50">Objectifs</dt>
                    <dd className="text-right text-white">
                      {status.objectifs ?? "Non précisés"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-white/50">Salle vidéo</dt>
                    <dd className="text-white">
                      {status.configured ? "Créée" : "Bientôt disponible (fournisseur non configuré)"}
                    </dd>
                  </div>
                </dl>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <div className="mt-6 rounded border border-white/10 bg-obsidianCard p-6">
                <h3 className="font-display text-base font-semibold text-white">
                  Apprenants attendus ({apprenantsGroupe.length})
                </h3>
                <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {apprenantsGroupe.map((a) => (
                    <li key={a.matricule} className="font-sans text-sm text-white/70">
                      {a.prenom} {a.nom}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="mt-6 flex items-center gap-3">
                {status.withinJoinWindow && status.roomUrl ? (
                  <Button variant="dark" onClick={() => setLaunched(true)}>
                    Lancer la Classe Virtuelle
                  </Button>
                ) : (
                  <p className="font-sans text-sm text-white/50">
                    La salle ouvre 10 min avant le début de la séance.
                  </p>
                )}
              </div>
            </Reveal>
          </>
        )}
      </div>
    </div>
  );
}
