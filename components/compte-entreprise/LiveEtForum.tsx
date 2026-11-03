"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { entrepriseMatricule, fmtDateHeure } from "./entrepriseApi";

interface Live {
  id: string;
  titre: string;
  description: string | null;
  startAt: string | null;
  dureeMinutes: number;
  statut: string;
}

interface Stand {
  id: string;
  nom: string;
  presentation: string | null;
  offresTexte: string | null;
  statut: string;
}

const CARD = "rounded border border-white/10 bg-obsidianCard p-5";
const LABEL = "font-mono text-[11px] uppercase tracking-widest text-white/40";
const INPUT =
  "w-full rounded border border-white/15 bg-obsidian px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none disabled:opacity-40";
const BTN = "rounded bg-accent px-4 py-2 font-sans text-sm font-semibold text-obsidian disabled:opacity-40";
const BTN_GHOST =
  "rounded border border-white/20 px-3 py-1.5 font-sans text-xs text-white/80 hover:border-accent hover:text-accent disabled:opacity-40";
const messageErreur = (e: unknown) => (e instanceof Error ? e.message : "Une erreur est survenue.");

// Live dans la communauté (salle Daily broadcast-only, voir EntrepriseLive)
// et stand virtuel au forum (présentation, offres, créneaux — voir
// StandForum) : deux fonctionnalités distinctes de ForumLive/Admin, propres
// à chaque entreprise cliente.
export default function LiveEtForum() {
  const [lives, setLives] = useState<Live[]>([]);
  const [stand, setStand] = useState<Stand | null>(null);
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [nomStand, setNomStand] = useState("");
  const [presentation, setPresentation] = useState("");
  const [offresTexte, setOffresTexte] = useState("");
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const matricule = entrepriseMatricule();

  const charger = useCallback(() => {
    if (!matricule) return;
    apiGet<Live[]>(`/entreprises-comptes/${matricule}/lives`).then(setLives).catch(() => {});
    apiGet<Stand | null>(`/entreprises-comptes/${matricule}/stand`)
      .then((s) => {
        setStand(s);
        if (s) {
          setNomStand(s.nom);
          setPresentation(s.presentation ?? "");
          setOffresTexte(s.offresTexte ?? "");
        }
      })
      .catch(() => {});
  }, [matricule]);

  useEffect(() => {
    charger();
  }, [charger]);

  async function creerLive() {
    setErreur(null);
    setBusy(true);
    try {
      await apiPost(`/entreprises-comptes/${matricule}/lives`, {
        titre,
        description: description || undefined,
        startAt: startAt ? new Date(startAt).toISOString() : undefined,
      });
      setTitre("");
      setDescription("");
      setStartAt("");
      charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setBusy(false);
    }
  }

  async function ouvrirSalle(id: string) {
    setErreur(null);
    const fenetre = window.open("", "_blank");
    try {
      const r = await apiPost<{ configured: boolean; url: string | null }>(`/entreprises-comptes/${matricule}/lives/${id}/salle`, {});
      if (r.url && fenetre) fenetre.location.href = r.url;
      else {
        fenetre?.close();
        setErreur(r.configured ? "Impossible d'ouvrir la salle." : "La salle virtuelle n'est pas encore activée sur la plateforme.");
      }
    } catch (e) {
      fenetre?.close();
      setErreur(messageErreur(e));
    }
  }

  async function sauverStand(publie: boolean) {
    setErreur(null);
    setBusy(true);
    try {
      const s = await apiPut<Stand>(`/entreprises-comptes/${matricule}/stand`, {
        nom: nomStand,
        presentation: presentation || undefined,
        offresTexte: offresTexte || undefined,
        publie,
      });
      setStand(s);
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
        <h3 className="font-display text-lg font-semibold text-white">Communauté e-Staf</h3>
        <p className="mt-1 font-sans text-xs text-white/50">Rejoignez les lives et échanges de la communauté e-Staf.</p>
        <Link href="/communaute" target="_blank" className={`${BTN_GHOST} mt-3 inline-block`}>
          📡 Voir la communauté
        </Link>
      </div>

      <div className={CARD}>
        <h3 className="font-display text-lg font-semibold text-white">Mon live</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={LABEL} htmlFor="live-titre">Titre</label>
            <input id="live-titre" maxLength={160} className={`mt-1 ${INPUT}`} value={titre} onChange={(e) => setTitre(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL} htmlFor="live-desc">Description</label>
            <textarea id="live-desc" rows={2} maxLength={2000} className={`mt-1 ${INPUT}`} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className={LABEL} htmlFor="live-debut">Date et heure</label>
            <input id="live-debut" type="datetime-local" className={`mt-1 ${INPUT}`} value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </div>
        </div>
        <button className={`mt-3 ${BTN}`} disabled={busy || !titre.trim()} onClick={creerLive}>
          Planifier mon live
        </button>

        {lives.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-white/10 pt-3">
            {lives.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-sans text-sm text-white">
                  {l.titre}
                  <span className="block font-mono text-[11px] text-white/45">
                    {l.startAt ? fmtDateHeure(l.startAt) : "Date à définir"} · {l.statut}
                  </span>
                </p>
                {l.statut !== "annule" && l.statut !== "termine" && (
                  <button className={BTN_GHOST} onClick={() => ouvrirSalle(l.id)}>
                    🎥 Démarrer mon live
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={CARD}>
        <h3 className="font-display text-lg font-semibold text-white">Mon stand au forum virtuel</h3>
        <p className="mt-1 font-sans text-xs text-white/50">
          Présentation, offres et créneaux visibles par les candidats/apprenants pendant le forum virtuel.
          {stand && (
            <span className={`ml-2 font-mono text-[11px] uppercase ${stand.statut === "publie" ? "text-statusGreen" : "text-white/40"}`}>
              {stand.statut === "publie" ? "Publié" : "Brouillon"}
            </span>
          )}
        </p>
        <div className="mt-3 grid gap-3">
          <div>
            <label className={LABEL} htmlFor="stand-nom">Nom du stand</label>
            <input id="stand-nom" maxLength={120} className={`mt-1 ${INPUT}`} value={nomStand} onChange={(e) => setNomStand(e.target.value)} />
          </div>
          <div>
            <label className={LABEL} htmlFor="stand-presentation">Présentation</label>
            <textarea id="stand-presentation" rows={3} maxLength={4000} className={`mt-1 ${INPUT}`} value={presentation} onChange={(e) => setPresentation(e.target.value)} />
          </div>
          <div>
            <label className={LABEL} htmlFor="stand-offres">Offres</label>
            <textarea id="stand-offres" rows={3} maxLength={4000} className={`mt-1 ${INPUT}`} value={offresTexte} onChange={(e) => setOffresTexte(e.target.value)} />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button className={BTN_GHOST} disabled={busy || !nomStand.trim()} onClick={() => sauverStand(false)}>
            Enregistrer en brouillon
          </button>
          <button className={BTN} disabled={busy || !nomStand.trim()} onClick={() => sauverStand(true)}>
            Publier au forum
          </button>
        </div>
      </div>
    </div>
  );
}
