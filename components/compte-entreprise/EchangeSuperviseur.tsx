"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { entrepriseMatricule, fmtDateHeure } from "./entrepriseApi";

interface Message {
  id: string;
  auteur: string;
  texte: string;
  contratId: string | null;
  createdAt: string;
}

interface Bilan {
  id: string;
  contratId: string;
  clientNom: string | null;
  semaine: string;
  constat: string | null;
  analyse: string | null;
  axesAmelioration: string | null;
  superviseurNom: string | null;
}

const CARD = "rounded border border-white/10 bg-obsidianCard p-5";
const LABEL = "font-mono text-[11px] uppercase tracking-widest text-white/40";
const INPUT =
  "w-full rounded border border-white/15 bg-obsidian px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none disabled:opacity-40";
const BTN = "rounded bg-accent px-4 py-2 font-sans text-sm font-semibold text-obsidian disabled:opacity-40";
const messageErreur = (e: unknown) => (e instanceof Error ? e.message : "Une erreur est survenue.");

// Espace d'échange avec le Superviseur — reçoit ses bilans hebdomadaires
// (lecture, voir RapportHebdoSuperviseur) et permet une discussion à deux
// voix (MessageEntreprise). Le superviseur répond depuis son propre Espace
// (voir SuperviseursController.envoyerMessageEntreprise).
export default function EchangeSuperviseur() {
  const [bilans, setBilans] = useState<Bilan[] | "loading" | "erreur">("loading");
  const [messages, setMessages] = useState<Message[]>([]);
  const [texte, setTexte] = useState("");
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const matricule = entrepriseMatricule();

  const charger = useCallback(() => {
    if (!matricule) {
      setBilans("erreur");
      return;
    }
    apiGet<Bilan[]>(`/entreprises-comptes/${matricule}/bilans-superviseur`).then(setBilans).catch(() => setBilans("erreur"));
    apiGet<Message[]>(`/entreprises-comptes/${matricule}/messages`).then(setMessages).catch(() => {});
  }, [matricule]);

  useEffect(() => {
    charger();
    const t = setInterval(charger, 30_000);
    return () => clearInterval(t);
  }, [charger]);

  async function envoyer() {
    setErreur(null);
    setBusy(true);
    try {
      await apiPost(`/entreprises-comptes/${matricule}/messages`, { texte });
      setTexte("");
      charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {erreur && (
        <p className="rounded border border-statusRed/40 bg-statusRed/10 px-3 py-2 font-sans text-sm text-statusRed">{erreur}</p>
      )}

      <div className={CARD}>
        <h3 className="font-display text-lg font-semibold text-white">Bilans hebdomadaires du superviseur</h3>
        {bilans === "loading" ? (
          <p className="mt-3 font-sans text-sm text-white/50">Chargement...</p>
        ) : bilans === "erreur" ? (
          <p className="mt-3 font-sans text-sm text-white/50">Impossible de charger les bilans.</p>
        ) : bilans.length === 0 ? (
          <p className="mt-3 font-sans text-sm text-white/50">Aucun bilan transmis pour l&apos;instant.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {bilans.map((b) => (
              <li key={b.id} className="rounded border border-white/10 bg-obsidian p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-sans text-sm font-semibold text-white">
                    {b.semaine} · {b.clientNom ?? "—"}
                  </p>
                  <span className="font-mono text-[11px] text-white/40">{b.superviseurNom ?? "—"}</span>
                </div>
                {b.constat && <p className="mt-2 font-sans text-xs text-white/70"><span className={LABEL}>Constat</span><br />{b.constat}</p>}
                {b.analyse && <p className="mt-2 font-sans text-xs text-white/70"><span className={LABEL}>Analyse</span><br />{b.analyse}</p>}
                {b.axesAmelioration && (
                  <p className="mt-2 font-sans text-xs text-white/70"><span className={LABEL}>Axes d&apos;amélioration</span><br />{b.axesAmelioration}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={CARD}>
        <h3 className="font-display text-lg font-semibold text-white">Échange avec le superviseur</h3>
        {messages.length === 0 ? (
          <p className="mt-3 font-sans text-sm text-white/50">Aucun message pour l&apos;instant.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {messages.map((m) => (
              <li key={m.id} className={`rounded border px-3 py-2 ${m.auteur === "entreprise" ? "border-accent/30 bg-accent/5" : "border-white/10 bg-obsidian"}`}>
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                  {m.auteur === "entreprise" ? "Vous" : "Superviseur"} · {fmtDateHeure(m.createdAt)}
                </p>
                <p className="mt-1 font-sans text-sm text-white">{m.texte}</p>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex gap-2">
          <textarea
            aria-label="Votre message"
            rows={2}
            maxLength={2000}
            className={INPUT}
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
          />
        </div>
        <button className={`mt-2 ${BTN}`} disabled={busy || !texte.trim()} onClick={envoyer}>
          Envoyer
        </button>
      </div>
    </div>
  );
}
