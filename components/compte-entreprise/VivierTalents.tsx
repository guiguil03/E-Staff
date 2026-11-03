"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { entrepriseMatricule, fmtDate, INTERET_STATUT_LABELS } from "./entrepriseApi";

interface Profil {
  ref: string;
  label: string;
  type: "agent" | "apprenant";
  poste: string | null;
  niveau: string | null;
  totalScore: number | null;
  experienceAnnees: number | null;
  disponible: boolean;
}

interface Interet {
  id: string;
  statut: string;
  posteSouhaite: string | null;
  message: string | null;
  createdAt: string;
  clientNom: string | null;
  profil: { nom: string; matricule: string } | null;
}

interface Bilan {
  nom: string | null;
  tierLabel: string | null;
  totalScore: number | null;
  scores: { lexique: number | null; oral: number | null; situations: number | null; video: number | null; essay: number | null } | null;
  experienceAnnees: number | null;
  experienceSecteurs: string | null;
  posteVise: string | null;
  videoDisponible: boolean;
}

const CARD = "rounded border border-white/10 bg-obsidianCard p-5";
const LABEL = "font-mono text-[11px] uppercase tracking-widest text-white/40";
const BTN = "rounded bg-accent px-4 py-2 font-sans text-sm font-semibold text-obsidian disabled:opacity-40";
const BTN_GHOST =
  "rounded border border-white/20 px-3 py-1.5 font-sans text-xs text-white/80 hover:border-accent hover:text-accent disabled:opacity-40";
const INPUT =
  "w-full rounded border border-white/15 bg-obsidian px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none disabled:opacity-40";
const messageErreur = (e: unknown) => (e instanceof Error ? e.message : "Une erreur est survenue.");

// Vivier de talents (profils anonymisés) : l'entreprise voit des profils
// filtrés (compétences, disponibilité) sans aucune donnée d'identité, et
// exprime un intérêt — la RH e-Staf reste seule décisionnaire de
// l'affectation (voir InteretVivier.statut). L'identité n'est révélée
// qu'une fois l'affectation validée ("affecte").
export default function VivierTalents() {
  const [profils, setProfils] = useState<Profil[] | "loading" | "erreur">("loading");
  const [interets, setInterets] = useState<Interet[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [bilans, setBilans] = useState<Record<string, Bilan | "loading">>({});
  const matricule = entrepriseMatricule();

  const charger = useCallback(() => {
    if (!matricule) {
      setProfils("erreur");
      return;
    }
    apiGet<Profil[]>(`/entreprises-comptes/${matricule}/vivier`).then(setProfils).catch(() => setProfils("erreur"));
    apiGet<Interet[]>(`/entreprises-comptes/${matricule}/vivier/interets`).then(setInterets).catch(() => {});
  }, [matricule]);

  useEffect(() => {
    charger();
  }, [charger]);

  async function exprimerInteret(profil: Profil) {
    setErreur(null);
    setBusy(profil.ref);
    try {
      await apiPost(`/entreprises-comptes/${matricule}/vivier/interets`, {
        ref: profil.ref,
        type: profil.type,
        message: messages[profil.ref]?.trim() || undefined,
      });
      setMessages({ ...messages, [profil.ref]: "" });
      charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setBusy(null);
    }
  }

  async function voirBilan(interetId: string) {
    setBilans((b) => ({ ...b, [interetId]: "loading" }));
    try {
      const bilan = await apiGet<Bilan>(`/entreprises-comptes/${matricule}/vivier/interets/${interetId}/bilan`);
      setBilans((b) => ({ ...b, [interetId]: bilan }));
    } catch (e) {
      setErreur(messageErreur(e));
      setBilans((b) => {
        const { [interetId]: _removed, ...rest } = b;
        return rest;
      });
    }
  }

  if (profils === "loading") return <p className="font-sans text-sm text-white/50">Chargement...</p>;
  if (profils === "erreur") {
    return <p className="font-sans text-sm text-white/50">Impossible de charger le vivier de talents pour le moment.</p>;
  }

  return (
    <div className="space-y-4">
      {erreur && (
        <p className="rounded border border-statusRed/40 bg-statusRed/10 px-3 py-2 font-sans text-sm text-statusRed">{erreur}</p>
      )}

      <div className={CARD}>
        <h3 className="font-display text-lg font-semibold text-white">Profils disponibles</h3>
        <p className="mt-1 font-sans text-xs text-white/50">
          Profils anonymisés — exprimez votre intérêt, la RH e-Staf valide ensuite l&apos;affectation à votre équipe.
        </p>
        {profils.length === 0 ? (
          <p className="mt-4 font-sans text-sm text-white/50">Aucun profil disponible pour l&apos;instant.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {profils.map((p) => (
              <div key={p.ref} className="rounded border border-white/10 bg-obsidian p-4">
                <p className="font-sans text-sm font-semibold text-white">{p.label}</p>
                <p className="mt-1 font-mono text-[11px] text-white/50">{p.poste ?? "Poste non précisé"}</p>
                <p className="mt-1 font-sans text-xs text-white/70">{p.niveau ?? "Niveau non évalué"}</p>
                {p.totalScore !== null && (
                  <p className="font-sans text-xs text-accent">Score test : {p.totalScore}/100</p>
                )}
                {p.experienceAnnees !== null && (
                  <p className="font-sans text-xs text-white/50">{p.experienceAnnees} an(s) d&apos;expérience</p>
                )}
                <input
                  aria-label="Message (optionnel)"
                  placeholder="Message (optionnel)…"
                  maxLength={1000}
                  className={`${INPUT} mt-3 py-1.5 text-xs`}
                  value={messages[p.ref] ?? ""}
                  onChange={(e) => setMessages({ ...messages, [p.ref]: e.target.value })}
                />
                <button
                  className={`${BTN} mt-2 w-full`}
                  disabled={busy === p.ref}
                  onClick={() => exprimerInteret(p)}
                >
                  Exprimer mon intérêt
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={CARD}>
        <h3 className="font-display text-lg font-semibold text-white">Mes demandes</h3>
        {interets.length === 0 ? (
          <p className="mt-3 font-sans text-sm text-white/50">Aucune demande pour l&apos;instant.</p>
        ) : (
          <ul className="mt-3 divide-y divide-white/5">
            {interets.map((i) => (
              <li key={i.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-sans text-sm text-white">
                    {i.profil ? i.profil.nom : "Profil en cours de traitement"}
                    <span className="ml-2 font-mono text-[11px] text-white/40">{fmtDate(i.createdAt)}</span>
                  </p>
                  <span className="font-mono text-[11px] uppercase tracking-widest text-accent">
                    {INTERET_STATUT_LABELS[i.statut] ?? i.statut}
                  </span>
                </div>
                {i.message && <p className="mt-1 font-sans text-xs italic text-white/50">« {i.message} »</p>}
                {i.statut === "affecte" && (
                  <div className="mt-2">
                    <button className={BTN_GHOST} onClick={() => voirBilan(i.id)}>
                      Voir le bilan avant prise de poste
                    </button>
                    {bilans[i.id] === "loading" && <p className="mt-2 font-sans text-xs text-white/50">Chargement...</p>}
                    {bilans[i.id] && bilans[i.id] !== "loading" && (
                      <div className="mt-2 rounded border border-white/10 bg-obsidian p-3">
                        {(() => {
                          const b = bilans[i.id] as Bilan;
                          return (
                            <>
                              <p className={LABEL}>Palier obtenu</p>
                              <p className="font-sans text-sm text-white">{b.tierLabel ?? "Non évalué"}</p>
                              {b.totalScore !== null && (
                                <p className="font-sans text-xs text-accent">Score global : {b.totalScore}/100</p>
                              )}
                              {b.posteVise && <p className="mt-1 font-sans text-xs text-white/60">Poste visé : {b.posteVise}</p>}
                              {b.experienceAnnees !== null && (
                                <p className="font-sans text-xs text-white/60">
                                  {b.experienceAnnees} an(s) d&apos;expérience{b.experienceSecteurs ? ` · ${b.experienceSecteurs}` : ""}
                                </p>
                              )}
                              {b.videoDisponible && (
                                <a
                                  className={`${BTN_GHOST} mt-2 inline-block`}
                                  href={`${(process.env.NEXT_PUBLIC_API_URL_Dev ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001")}/entreprises-comptes/${matricule}/vivier/interets/${i.id}/bilan/video`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  ▶ Voir la vidéo de présentation
                                </a>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
