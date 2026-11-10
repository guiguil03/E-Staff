"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { entrepriseMatricule, fmtDateHeure } from "./entrepriseApi";

interface Profil {
  ref: string;
  label: string;
  poste: string | null;
  niveau: string | null;
  totalScore: number | null;
  experienceAnnees: number | null;
}

interface Entretien {
  id: string;
  titre: string;
  startAt: string | null;
  dureeMinutes: number;
  createdAt: string;
  salleDisponible: boolean;
  profilLabel: string | null;
}

const CARD = "rounded border border-white/10 bg-obsidianCard p-5";
const LABEL = "font-mono text-[11px] uppercase tracking-widest text-white/40";
const INPUT =
  "w-full rounded border border-white/15 bg-obsidian px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none disabled:opacity-40";
const BTN = "rounded bg-accent px-4 py-2 font-sans text-sm font-semibold text-obsidian disabled:opacity-40";
const messageErreur = (e: unknown) => (e instanceof Error ? e.message : "Une erreur est survenue.");

// Salle d'entretien virtuel — l'entreprise choisit un profil ANONYMISÉ du
// vivier de talents (ou saisit l'e-mail d'un candidat hors vivier) et planifie
// l'entretien. Le lien de la salle Daily est envoyé par e-mail au candidat
// (qui n'a pas de compte à ce stade) ; l'entreprise rejoint la sienne depuis
// la liste ci-dessous, via un lien nominatif émis à la demande.
export default function SalleEntretien() {
  const [profils, setProfils] = useState<Profil[] | "loading" | "erreur">("loading");
  const [profilRef, setProfilRef] = useState("");
  const [entretiens, setEntretiens] = useState<Entretien[] | "loading" | "erreur">("loading");
  const [titre, setTitre] = useState("");
  const [emailCandidat, setEmailCandidat] = useState("");
  const [startAt, setStartAt] = useState("");
  const [dureeMinutes, setDureeMinutes] = useState("30");
  const [busy, setBusy] = useState(false);
  const [rejoindreId, setRejoindreId] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const matricule = entrepriseMatricule();

  const charger = useCallback(() => {
    if (!matricule) {
      setEntretiens("erreur");
      setProfils("erreur");
      return;
    }
    apiGet<Entretien[]>(`/entreprises-comptes/${matricule}/entretiens`).then(setEntretiens).catch(() => setEntretiens("erreur"));
    apiGet<Profil[]>(`/entreprises-comptes/${matricule}/vivier`).then(setProfils).catch(() => setProfils("erreur"));
  }, [matricule]);

  useEffect(() => {
    charger();
  }, [charger]);

  async function planifier() {
    setErreur(null);
    setSucces(null);
    setBusy(true);
    try {
      const r = await apiPost<{ configured: boolean; emailEnvoye: boolean }>(`/entreprises-comptes/${matricule}/entretiens`, {
        titre,
        profilRef: profilRef || undefined,
        emailCandidat: profilRef ? undefined : emailCandidat || undefined,
        startAt: startAt ? new Date(startAt).toISOString() : undefined,
        dureeMinutes: Number(dureeMinutes),
      });
      setSucces(
        r.emailEnvoye
          ? "Entretien planifié — le lien a été envoyé par e-mail au candidat."
          : r.configured
            ? "Entretien créé — l'e-mail n'a pas pu être envoyé, contactez le candidat directement."
            : "Entretien créé — la salle virtuelle n'est pas encore activée sur la plateforme."
      );
      setTitre("");
      setProfilRef("");
      setEmailCandidat("");
      setStartAt("");
      charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setBusy(false);
    }
  }

  // Lien nominatif émis à la demande (jamais l'URL brute de la salle). L'onglet
  // est ouvert tout de suite pour ne pas être bloqué par l'anti-popup.
  async function rejoindre(id: string) {
    setErreur(null);
    setRejoindreId(id);
    const win = window.open("", "_blank");
    try {
      const r = await apiPost<{ configured: boolean; url: string | null }>(
        `/entreprises-comptes/${matricule}/entretiens/${id}/rejoindre`,
        {}
      );
      if (!r.url) throw new Error("La salle virtuelle n'est pas encore activée sur la plateforme.");
      if (win) win.location.href = r.url;
      else window.location.href = r.url;
    } catch (e) {
      win?.close();
      setErreur(messageErreur(e));
    } finally {
      setRejoindreId(null);
    }
  }

  return (
    <div className="space-y-4">
      {erreur && (
        <p className="rounded border border-statusRed/40 bg-statusRed/10 px-3 py-2 font-sans text-sm text-statusRed">{erreur}</p>
      )}
      {succes && (
        <p className="rounded border border-statusGreen/40 bg-statusGreen/10 px-3 py-2 font-sans text-sm text-statusGreen">{succes}</p>
      )}

      <div className={CARD}>
        <h3 className="font-display text-lg font-semibold text-white">Planifier un entretien</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={LABEL} htmlFor="ent-titre">Titre</label>
            <input id="ent-titre" maxLength={160} className={`mt-1 ${INPUT}`} value={titre} onChange={(e) => setTitre(e.target.value)} />
          </div>

          <div className="sm:col-span-2">
            <p className={LABEL}>Avec qui souhaitez-vous faire l&apos;entretien ?</p>
            <p className="mt-1 font-sans text-xs text-white/50">
              Profils anonymisés du vivier de talents : l&apos;invitation part vers le candidat sans que son identité vous soit révélée.
            </p>
            {profils === "loading" ? (
              <p className="mt-2 font-sans text-sm text-white/50">Chargement du vivier...</p>
            ) : profils === "erreur" ? (
              <p className="mt-2 font-sans text-sm text-white/50">Vivier indisponible : saisissez l&apos;e-mail d&apos;un candidat ci-dessous.</p>
            ) : profils.length === 0 ? (
              <p className="mt-2 font-sans text-sm text-white/50">Aucun profil disponible dans le vivier pour l&apos;instant.</p>
            ) : (
              <ul className="mt-2 grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2" role="radiogroup" aria-label="Profils du vivier">
                {profils.map((p) => {
                  const choisi = profilRef === p.ref;
                  const details = [
                    p.totalScore !== null ? `Score ${p.totalScore}/100` : null,
                    p.experienceAnnees !== null ? `${p.experienceAnnees} an(s) d'expérience` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <li key={p.ref}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={choisi}
                        onClick={() => setProfilRef(choisi ? "" : p.ref)}
                        className={`w-full rounded border px-3 py-2 text-left font-sans text-sm transition-colors ${
                          choisi ? "border-accent bg-accent/10 text-white" : "border-white/15 text-white/80 hover:border-white/30"
                        }`}
                      >
                        <span className="font-semibold">{p.label}</span>
                        <span className="block text-xs text-white/60">
                          {[p.poste, p.niveau].filter(Boolean).join(" · ") || "Profil du vivier"}
                        </span>
                        {details && <span className="block text-xs text-white/45">{details}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {!profilRef && (
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="ent-email">Ou e-mail d&apos;un candidat hors vivier</label>
              <input
                id="ent-email"
                type="email"
                className={`mt-1 ${INPUT}`}
                value={emailCandidat}
                onChange={(e) => setEmailCandidat(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className={LABEL} htmlFor="ent-debut">Date et heure</label>
            <input id="ent-debut" type="datetime-local" className={`mt-1 ${INPUT}`} value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </div>
          <div>
            <label className={LABEL} htmlFor="ent-duree">Durée (min)</label>
            <input id="ent-duree" type="number" min={10} max={240} className={`mt-1 ${INPUT}`} value={dureeMinutes} onChange={(e) => setDureeMinutes(e.target.value)} />
          </div>
        </div>
        <button
          className={`mt-3 ${BTN}`}
          disabled={busy || !titre.trim() || (!profilRef && !emailCandidat.trim())}
          onClick={planifier}
        >
          Planifier et envoyer l&apos;invitation
        </button>
      </div>

      <div className={CARD}>
        <h3 className="font-display text-lg font-semibold text-white">Entretiens planifiés</h3>
        {entretiens === "loading" ? (
          <p className="mt-3 font-sans text-sm text-white/50">Chargement...</p>
        ) : entretiens === "erreur" ? (
          <p className="mt-3 font-sans text-sm text-white/50">Impossible de charger les entretiens.</p>
        ) : entretiens.length === 0 ? (
          <p className="mt-3 font-sans text-sm text-white/50">Aucun entretien planifié.</p>
        ) : (
          <ul className="mt-3 divide-y divide-white/5">
            {entretiens.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-2 font-sans text-sm text-white">
                <span>
                  {e.titre}
                  <span className="block font-mono text-[11px] text-white/45">
                    {e.startAt ? fmtDateHeure(e.startAt) : "Date à définir"} · {e.dureeMinutes} min
                    {e.profilLabel ? ` · ${e.profilLabel}` : ""}
                  </span>
                </span>
                {e.salleDisponible ? (
                  <button className={BTN} disabled={rejoindreId === e.id} onClick={() => rejoindre(e.id)}>
                    {rejoindreId === e.id ? "Ouverture..." : "Rejoindre la salle"}
                  </button>
                ) : (
                  <span className="font-mono text-[11px] text-white/35">Salle indisponible</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
