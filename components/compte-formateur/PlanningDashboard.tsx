"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { useRequireRole } from "@/lib/useRequireRole";
import { apiDelete, apiGet, apiPut, ApiError } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";
import {
  DERNIERE_SEANCE_PASSEE,
  OBJECTIFS_PAR_DEFAUT,
  SEANCE_NUMBERS,
  apprenantIdFromMatricule,
} from "./exampleData";
import { COMPETENCY_DEFS, tauxAssimilation } from "./gradingGrids";
import SupportsCoursCard from "./SupportsCoursCard";

type NotationMap = Record<string, Record<string, { scoreOn20: number | null }>>;

interface SeanceApi {
  id: string;
  groupeCle: string;
  numero: number;
  startAt: string | null;
  dureeMinutes: number;
  objectifs: string | null;
  dailyRoomName: string | null;
  dailyRoomUrl: string | null;
}

interface GroupeApi {
  id: string;
  cle: string;
  label: string;
  moyenne: number | null;
  statut: "vert" | "orange" | "rouge";
  apprenantsCount: number;
}

interface ApprenantListApi {
  matricule: string;
  prenom: string;
  nom: string;
  groupeCle: string;
}

function formateurHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-formateur-matricule": matricule } : {};
}

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Page dédiée "Planning par Groupe & Moyenne de Séance" — pilotage
// pédagogique séance par séance. La saisie détaillée par compétence (grille
// de critères pour Expression Orale/Écrite et Posture & Éloquence, dépôt +
// note pour Compréhension Orale/Écrite) se fait sur la page dédiée
// /compte/formateur/planning/noter/[apprenantId] (bouton "Noter" par
// ligne) — ce tableau reste une vue de lecture qui agrège les scores.
// Persisté en base (table Notation, depuis le 2026-08-07) — l'apprenant
// concerné voit exactement les mêmes données depuis son propre compte.
export default function PlanningDashboard() {
  const checked = useRequireRole("formateur");
  const searchParams = useSearchParams();
  const [groupes, setGroupes] = useState<GroupeApi[] | "loading" | "erreur">("loading");
  const [apprenants, setApprenants] = useState<ApprenantListApi[] | "loading" | "erreur">("loading");
  const [groupeKey, setGroupeKey] = useState(searchParams.get("groupe") || "");
  const [seance, setSeance] = useState(Number(searchParams.get("seance") ?? "1"));
  const [objectifs, setObjectifs] = useState(OBJECTIFS_PAR_DEFAUT[1] ?? "");
  const [horaireSeance, setHoraireSeance] = useState<SeanceApi | null>(null);
  const [horaireInput, setHoraireInput] = useState("");
  const [dureeInput, setDureeInput] = useState(90);
  const [horaireStatus, setHoraireStatus] = useState<"idle" | "loading" | "saving" | "error">(
    "idle"
  );
  const [horaireError, setHoraireError] = useState<string | null>(null);
  const [notations, setNotations] = useState<NotationMap | "loading" | "erreur">("loading");

  // Groupes/apprenants branchés sur le vrai backend, scopés au formateur
  // connecté (voir CockpitService.getGroupes/listApprenants) — avant, cette
  // page listait les 6 groupes fictifs A-F et 30 faux apprenants
  // d'exampleData.ts quel que soit le formateur, ce qui pouvait faire
  // planifier une séance pour un groupe/apprenant réel différent de celui
  // affiché (bug relevé le 2026-09-22 : le formateur planifiait bien en
  // base, mais l'apprenant vérifié ensuite n'était pas réellement dans ce
  // groupe).
  useEffect(() => {
    if (!checked) return;
    setGroupes("loading");
    apiGet<GroupeApi[]>("/cockpit/groupes", formateurHeaders())
      .then((data) => {
        setGroupes(data);
        setGroupeKey((current) => current || data[0]?.cle || "");
      })
      .catch(() => setGroupes("erreur"));
    setApprenants("loading");
    apiGet<ApprenantListApi[]>("/cockpit/apprenants", formateurHeaders())
      .then(setApprenants)
      .catch(() => setApprenants("erreur"));
  }, [checked]);

  const apprenantsGroupe = Array.isArray(apprenants)
    ? apprenants.filter((a) => a.groupeCle === groupeKey)
    : [];

  useEffect(() => {
    setObjectifs(OBJECTIFS_PAR_DEFAUT[seance] ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupeKey, seance]);

  useEffect(() => {
    if (!groupeKey) return;
    let cancelled = false;
    setNotations("loading");
    apiGet<NotationMap>(`/notations/${groupeKey}/${seance}`, formateurHeaders())
      .then((data) => {
        if (!cancelled) setNotations(data);
      })
      .catch(() => {
        if (!cancelled) setNotations("erreur");
      });
    return () => {
      cancelled = true;
    };
  }, [groupeKey, seance]);

  useEffect(() => {
    if (!groupeKey) return;
    let cancelled = false;
    setHoraireStatus("loading");
    apiGet<SeanceApi>(`/seances/${groupeKey}/${seance}`, formateurHeaders())
      .then((data) => {
        if (cancelled) return;
        setHoraireSeance(data);
        setHoraireInput(data.startAt ? toDatetimeLocalValue(data.startAt) : "");
        setDureeInput(data.dureeMinutes);
        setHoraireStatus("idle");
      })
      .catch(() => {
        if (cancelled) return;
        setHoraireSeance(null);
        setHoraireStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [groupeKey, seance]);

  async function saveHoraire() {
    if (!horaireInput) return;
    setHoraireStatus("saving");
    setHoraireError(null);
    try {
      const startAt = new Date(horaireInput).toISOString();
      const data = await apiPut<SeanceApi>(
        `/seances/${groupeKey}/${seance}`,
        { startAt, dureeMinutes: dureeInput },
        formateurHeaders()
      );
      setHoraireSeance(data);
      setDureeInput(data.dureeMinutes);
      setHoraireStatus("idle");
    } catch (err) {
      setHoraireError(err instanceof ApiError ? err.message : "Erreur — réessayer.");
      setHoraireStatus("error");
    }
  }

  async function cancelHoraire() {
    setHoraireStatus("saving");
    setHoraireError(null);
    try {
      const data = await apiDelete<SeanceApi>(`/seances/${groupeKey}/${seance}`, formateurHeaders());
      setHoraireSeance(data);
      setHoraireInput("");
      setDureeInput(data.dureeMinutes);
      setHoraireStatus("idle");
    } catch (err) {
      setHoraireError(err instanceof ApiError ? err.message : "Erreur — réessayer.");
      setHoraireStatus("error");
    }
  }

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <p className="font-sans text-sm text-white/50">Chargement...</p>
      </div>
    );
  }

  function scoreFor(matricule: string, competencyKey: string): number | null {
    if (notations === "loading" || notations === "erreur") return null;
    return notations[matricule]?.[competencyKey]?.scoreOn20 ?? null;
  }

  function moyenneApprenant(matricule: string): number | null {
    const scores = COMPETENCY_DEFS.map((c) => scoreFor(matricule, c.key));
    if (scores.some((s) => s === null)) return null;
    const values = scores as number[];
    return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 100) / 100;
  }

  const moyennesApprenants = apprenantsGroupe.map((a) => moyenneApprenant(a.matricule));
  const moyennesCompletes = moyennesApprenants.filter((m): m is number => m !== null);
  const moyenneGroupe =
    moyennesCompletes.length > 0
      ? Math.round(
          (moyennesCompletes.reduce((s, m) => s + m, 0) / moyennesCompletes.length) * 100
        ) / 100
      : null;

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
            Planning par Groupe &amp; Moyenne de Séance
          </h1>
        </Reveal>

        <Reveal delay={40}>
          <div className="mt-6 flex flex-wrap items-end gap-4 rounded border border-white/10 bg-obsidianCard p-4">
            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                Groupe
              </label>
              <select
                value={groupeKey}
                onChange={(e) => setGroupeKey(e.target.value)}
                disabled={!Array.isArray(groupes)}
                className="mt-1 rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
              >
                {Array.isArray(groupes) &&
                  groupes.map((g) => (
                    <option key={g.cle} value={g.cle}>
                      {g.label}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                Séance
              </label>
              <select
                value={seance}
                onChange={(e) => setSeance(Number(e.target.value))}
                className="mt-1 rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
              >
                {SEANCE_NUMBERS.map((n) => (
                  <option key={n} value={n}>
                    Séance n°{n} {n <= DERNIERE_SEANCE_PASSEE ? "(passée)" : "(à venir)"}
                  </option>
                ))}
              </select>
            </div>
            <p className="font-mono text-xs text-white/40">
              {groupes === "loading" && "Chargement des groupes..."}
              {groupes === "erreur" && "Impossible de charger vos groupes."}
              {Array.isArray(groupes) && groupes.length === 0 && "Aucun groupe ne vous est assigné."}
              {Array.isArray(groupes) &&
                groupes.length > 0 &&
                `${apprenantsGroupe.length} apprenants dans ce groupe`}
            </p>
          </div>
        </Reveal>

        <Reveal delay={60}>
          <div className="mt-6 rounded border border-white/10 bg-obsidianCard p-6">
            <h3 className="font-display text-base font-semibold text-white">
              Horaire &amp; Classe virtuelle
            </h3>
            <div className="mt-3 flex flex-wrap items-end gap-4">
              <div>
                <label
                  htmlFor="horaire-seance"
                  className="block font-mono text-xs uppercase tracking-widest text-white/50"
                >
                  Date &amp; heure
                </label>
                <input
                  id="horaire-seance"
                  type="datetime-local"
                  value={horaireInput}
                  onChange={(e) => setHoraireInput(e.target.value)}
                  className="mt-1 rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
                />
              </div>
              <div>
                <label
                  htmlFor="duree-seance"
                  className="block font-mono text-xs uppercase tracking-widest text-white/50"
                >
                  Durée (min)
                </label>
                <input
                  id="duree-seance"
                  type="number"
                  min={15}
                  step={5}
                  value={dureeInput}
                  onChange={(e) => setDureeInput(Math.max(15, Number(e.target.value)))}
                  className="mt-1 w-24 rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
                />
              </div>
              <Button
                variant="ghostDark"
                onClick={saveHoraire}
                disabled={!horaireInput || horaireStatus === "saving"}
              >
                {horaireStatus === "saving" ? "Enregistrement..." : "Planifier"}
              </Button>
              {horaireSeance?.startAt && (
                <Button variant="ghostDark" onClick={cancelHoraire} disabled={horaireStatus === "saving"}>
                  Annuler la planification
                </Button>
              )}
              {horaireSeance?.startAt && (
                <Link
                  href={`/compte/formateur/classe-virtuelle/${groupeKey}/${seance}`}
                  className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
                >
                  Voir la page de lancement →
                </Link>
              )}
              <p className="font-mono text-xs text-white/40">
                {horaireStatus === "loading" && "Chargement..."}
                {horaireStatus === "error" && (
                  <span className="text-accent">{horaireError ?? "Erreur — réessayer."}</span>
                )}
                {horaireStatus === "idle" && horaireSeance?.startAt && (
                  <>
                    {horaireSeance.dailyRoomName
                      ? "Salle vidéo créée."
                      : "Salle vidéo : bientôt disponible (fournisseur non configuré)."}{" "}
                    Se termine à{" "}
                    {new Date(
                      new Date(horaireSeance.startAt).getTime() + horaireSeance.dureeMinutes * 60000
                    ).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}{" "}
                    — bascule ensuite en séance passée.
                  </>
                )}
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-6 rounded border border-white/10 bg-obsidianCard p-6">
            <label
              htmlFor="objectifs"
              className="block font-sans text-sm font-semibold text-white"
            >
              Objectifs visés
            </label>
            <textarea
              id="objectifs"
              rows={2}
              value={objectifs}
              onChange={(e) => setObjectifs(e.target.value)}
              className="mt-2 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
            />

            {groupeKey && <SupportsCoursCard groupeKey={groupeKey} seance={seance} />}
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-6 rounded border border-white/10 bg-obsidianCard p-6">
            <h3 className="font-display text-base font-semibold text-white">
              Grille des 5 compétences (/20)
            </h3>
            <p className="mt-1 font-sans text-xs text-white/50">
              Vue de lecture — la notation détaillée (grille de critères ou dépôt de document) se
              fait via le bouton &laquo; Noter &raquo;.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] font-sans text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs text-white/40">
                    <th className="py-2 pr-2 font-mono font-normal">Apprenant</th>
                    {COMPETENCY_DEFS.map((c) => (
                      <th key={c.key} className="py-2 pr-2 font-mono font-normal">
                        {c.label}
                      </th>
                    ))}
                    <th className="py-2 pr-2 font-mono font-normal text-right">Moyenne</th>
                    <th className="py-2 pr-2 font-mono font-normal text-right">Assimilation</th>
                    <th className="py-2 font-mono font-normal text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {apprenants === "loading" && (
                    <tr>
                      <td colSpan={COMPETENCY_DEFS.length + 3} className="py-4 text-center text-white/50">
                        Chargement des apprenants...
                      </td>
                    </tr>
                  )}
                  {apprenants === "erreur" && (
                    <tr>
                      <td colSpan={COMPETENCY_DEFS.length + 3} className="py-4 text-center text-white/50">
                        Impossible de charger les apprenants de ce groupe.
                      </td>
                    </tr>
                  )}
                  {apprenantsGroupe.map((a) => {
                    const moyenne = moyenneApprenant(a.matricule);
                    return (
                      <tr key={a.matricule} className="border-b border-white/5">
                        <td className="py-2 pr-2 text-white">
                          {a.prenom} {a.nom}
                        </td>
                        {COMPETENCY_DEFS.map((c) => {
                          const score = scoreFor(a.matricule, c.key);
                          return (
                            <td key={c.key} className="py-2 pr-2 text-white/80">
                              {score ?? "—"}
                            </td>
                          );
                        })}
                        <td className="py-2 pr-2 text-right font-mono text-sm text-accent">
                          {moyenne ?? "—"}
                        </td>
                        <td className="py-2 pr-2 text-right font-mono text-sm text-white/70">
                          {moyenne !== null ? `${tauxAssimilation(moyenne)}%` : "—"}
                        </td>
                        <td className="py-2 text-right">
                          <Link
                            href={`/compte/formateur/planning/noter/${apprenantIdFromMatricule(a.matricule)}?seance=${seance}&groupe=${groupeKey}`}
                            className="inline-block rounded border border-accent/40 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-accent hover:bg-accent/10"
                          >
                            Noter
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <p className="font-sans text-sm font-semibold text-white">
                Moyenne du Groupe — Séance n°{seance}
              </p>
              <p className="font-display text-xl font-bold text-accent">
                {moyenneGroupe ?? "—"}
                <span className="text-sm font-normal text-white/40">/20</span>
                {moyenneGroupe !== null && (
                  <span className="ml-3 font-sans text-sm font-normal text-white/50">
                    {tauxAssimilation(moyenneGroupe)}% d&apos;assimilation
                  </span>
                )}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
