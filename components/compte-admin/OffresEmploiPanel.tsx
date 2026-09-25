"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiDelete, apiGet, apiPostAuthed, apiPut, ApiError } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";
import OffreCard from "@/components/studio-metier/OffreCard";
import { ALL_METIERS } from "@/components/studio-metier/data";
import { badgeOffre, statutApercu, type OffreEmploi } from "@/components/studio-metier/offres";

interface OffreRh extends OffreEmploi {
  publiee: boolean;
  nbCandidatures: number;
}

interface FormState {
  metierSlug: string;
  titre: string;
  drapeau: string;
  modalites: string;
  projet: string;
  remuneration: string;
  prerequis: string;
  placesTotal: string;
  placesPourvues: string;
  dateLimite: string;
  cloturee: boolean;
  publiee: boolean;
  lienWhatsapp: string;
}

const FORM_VIDE: FormState = {
  metierSlug: ALL_METIERS[0]?.slug ?? "",
  titre: "",
  drapeau: "",
  modalites: "",
  projet: "",
  remuneration: "",
  prerequis: "",
  placesTotal: "10",
  placesPourvues: "0",
  dateLimite: "",
  cloturee: false,
  publiee: true,
  lienWhatsapp: "",
};

const BADGE_TONE = {
  vert: "text-statusGreen",
  orange: "text-statusOrange",
  rouge: "text-statusRed",
} as const;

function toForm(o: OffreRh): FormState {
  return {
    metierSlug: o.metierSlug,
    titre: o.titre,
    drapeau: o.drapeau ?? "",
    modalites: o.modalites.join(", "),
    projet: o.projet ?? "",
    remuneration: o.remuneration ?? "",
    prerequis: o.prerequis ?? "",
    placesTotal: String(o.placesTotal),
    placesPourvues: String(o.placesPourvues),
    dateLimite: o.dateLimite ? o.dateLimite.slice(0, 10) : "",
    cloturee: o.cloturee,
    publiee: o.publiee,
    lienWhatsapp: o.lienWhatsapp ?? "",
  };
}

function toPayload(f: FormState) {
  return {
    metierSlug: f.metierSlug,
    titre: f.titre.trim(),
    drapeau: f.drapeau.trim() || null,
    modalites: f.modalites.split(",").map((m) => m.trim()).filter(Boolean),
    projet: f.projet.trim() || null,
    remuneration: f.remuneration.trim() || null,
    prerequis: f.prerequis.trim() || null,
    placesTotal: Number(f.placesTotal),
    placesPourvues: Number(f.placesPourvues || 0),
    // Date limite = fin de journée (heure locale) du jour choisi.
    dateLimite: f.dateLimite ? new Date(`${f.dateLimite}T23:59:59`).toISOString() : null,
    cloturee: f.cloturee,
    publiee: f.publiee,
    lienWhatsapp: f.lienWhatsapp.trim() || null,
  };
}

// Portail RH — offres d'emploi de la vitrine Studio Métier (/offres/carrieres),
// mises à jour au quotidien sans toucher au code (demande cliente du
// 2026-09-19). Le statut (🟢/🟠/🔴) et l'activation du bouton « Postuler »
// sont automatiques : la RH ne gère que les places, la date limite et, si
// besoin, une fermeture manuelle.
export default function OffresEmploiPanel() {
  const [offres, setOffres] = useState<OffreRh[] | "loading" | "erreur">("loading");
  const [edition, setEdition] = useState<{ id: string | null; form: FormState } | null>(null);
  const [etat, setEtat] = useState<"idle" | "saving">("idle");
  const [erreur, setErreur] = useState<string | null>(null);

  function refresh() {
    apiGet<OffreRh[]>("/rh/offres-emploi", adminHeaders())
      .then(setOffres)
      .catch(() => setOffres("erreur"));
  }

  useEffect(refresh, []);

  function messageErreur(err: unknown): string {
    return err instanceof ApiError ? err.message : "Enregistrement impossible — réessayez.";
  }

  async function enregistrer() {
    if (!edition) return;
    setEtat("saving");
    setErreur(null);
    try {
      const payload = toPayload(edition.form);
      if (edition.id) {
        await apiPut(`/rh/offres-emploi/${edition.id}`, payload, adminHeaders());
      } else {
        await apiPostAuthed("/rh/offres-emploi", payload, adminHeaders());
      }
      setEdition(null);
      refresh();
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setEtat("idle");
    }
  }

  // Actions rapides depuis la liste (sans ouvrir le formulaire).
  async function patch(o: OffreRh, data: Partial<ReturnType<typeof toPayload>>) {
    setErreur(null);
    try {
      await apiPut(`/rh/offres-emploi/${o.id}`, data, adminHeaders());
      refresh();
    } catch (err) {
      setErreur(messageErreur(err));
    }
  }

  async function supprimer(o: OffreRh) {
    if (!window.confirm(`Supprimer l'offre « ${o.titre} » ? Les candidatures reçues sont conservées.`)) return;
    setErreur(null);
    try {
      await apiDelete(`/rh/offres-emploi/${o.id}`, adminHeaders());
      refresh();
    } catch (err) {
      setErreur(messageErreur(err));
    }
  }

  const f = edition?.form;
  const set = (patchForm: Partial<FormState>) =>
    setEdition((e) => (e ? { ...e, form: { ...e.form, ...patchForm } } : e));
  const apercu: OffreEmploi | null = f
    ? {
        id: "apercu",
        metierSlug: f.metierSlug,
        titre: f.titre || "Intitulé du poste",
        drapeau: f.drapeau || null,
        modalites: f.modalites.split(",").map((m) => m.trim()).filter(Boolean),
        projet: f.projet || null,
        remuneration: f.remuneration || null,
        prerequis: f.prerequis || null,
        placesTotal: Number(f.placesTotal) || 0,
        placesPourvues: Number(f.placesPourvues) || 0,
        dateLimite: f.dateLimite ? new Date(`${f.dateLimite}T23:59:59`).toISOString() : null,
        cloturee: f.cloturee,
        lienWhatsapp: f.lienWhatsapp || null,
        createdAt: new Date().toISOString(),
        ...statutApercu({
          placesTotal: Number(f.placesTotal) || 0,
          placesPourvues: Number(f.placesPourvues) || 0,
          dateLimite: f.dateLimite ? new Date(`${f.dateLimite}T23:59:59`).toISOString() : null,
          cloturee: f.cloturee,
        }),
      }
    : null;

  const inputClass =
    "mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent";
  const labelClass = "block font-mono text-[11px] uppercase tracking-widest text-white/50";

  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-semibold text-white">Offres d&apos;emploi</h3>
            <p className="mt-1 font-mono text-[11px] text-white/40">
              Affichées sur la vitrine Studio Métier. Le badge 🟢/🟠/🔴 et le bouton « Postuler » se
              mettent à jour tout seuls selon les places et la date limite.
            </p>
          </div>
          {!edition && (
            <Button variant="dark" onClick={() => setEdition({ id: null, form: FORM_VIDE })}>
              + Nouvelle offre
            </Button>
          )}
        </div>

        {erreur && <p className="mt-4 font-sans text-sm text-accent">{erreur}</p>}

        {edition && f && apercu && (
          <div className="mt-6 grid gap-6 border-t border-white/10 pt-6 lg:grid-cols-2">
            <div className="space-y-4">
              <p className="font-sans text-sm font-semibold text-white">
                {edition.id ? "Modifier l'offre" : "Nouvelle offre"}
              </p>
              <div className="grid gap-4 sm:grid-cols-[1fr_90px]">
                <label className={labelClass}>
                  Intitulé du poste *
                  <input
                    className={inputClass}
                    value={f.titre}
                    onChange={(e) => set({ titre: e.target.value })}
                    placeholder="Téléprospecteur PAC — Marché Canadien"
                  />
                </label>
                <label className={labelClass}>
                  Drapeau
                  <input
                    className={inputClass}
                    value={f.drapeau}
                    onChange={(e) => set({ drapeau: e.target.value })}
                    placeholder="🇨🇦"
                  />
                </label>
              </div>
              <label className={labelClass}>
                Métier (vitrine) *
                <select
                  className={inputClass}
                  value={f.metierSlug}
                  onChange={(e) => set({ metierSlug: e.target.value })}
                >
                  {ALL_METIERS.map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Modalités (séparées par des virgules)
                <input
                  className={inputClass}
                  value={f.modalites}
                  onChange={(e) => set({ modalites: e.target.value })}
                  placeholder="Télétravail, Temps plein, GMT-5, Niveau C1"
                />
              </label>
              <label className={labelClass}>
                Projet
                <textarea
                  rows={2}
                  className={inputClass}
                  value={f.projet}
                  onChange={(e) => set({ projet: e.target.value })}
                  placeholder="Prise de RDV qualifiés sur les pompes à chaleur au Canada."
                />
              </label>
              <label className={labelClass}>
                Rémunération
                <input
                  className={inputClass}
                  value={f.remuneration}
                  onChange={(e) => set({ remuneration: e.target.value })}
                  placeholder="Fixe (dès 70% d'objectifs) + Primes de dépassement."
                />
              </label>
              <label className={labelClass}>
                Prérequis
                <input
                  className={inputClass}
                  value={f.prerequis}
                  onChange={(e) => set({ prerequis: e.target.value })}
                  placeholder="PC, connexion fibre, solution de secours électrique."
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className={labelClass}>
                  Places totales *
                  <input
                    type="number"
                    min={1}
                    className={inputClass}
                    value={f.placesTotal}
                    onChange={(e) => set({ placesTotal: e.target.value })}
                  />
                </label>
                <label className={labelClass}>
                  Places pourvues
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={f.placesPourvues}
                    onChange={(e) => set({ placesPourvues: e.target.value })}
                  />
                </label>
                <label className={labelClass}>
                  Date limite
                  <input
                    type="date"
                    className={inputClass}
                    value={f.dateLimite}
                    onChange={(e) => set({ dateLimite: e.target.value })}
                  />
                </label>
              </div>
              <label className={labelClass}>
                Lien WhatsApp (facultatif — sinon formulaire de candidature)
                <input
                  className={inputClass}
                  value={f.lienWhatsapp}
                  onChange={(e) => set({ lienWhatsapp: e.target.value })}
                  placeholder="https://wa.me/261..."
                />
              </label>
              <div className="flex flex-wrap gap-5 font-sans text-sm text-white/80">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-accent"
                    checked={f.publiee}
                    onChange={(e) => set({ publiee: e.target.checked })}
                  />
                  Publiée sur la vitrine
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-accent"
                    checked={f.cloturee}
                    onChange={(e) => set({ cloturee: e.target.checked })}
                  />
                  Clôturer manuellement
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="dark"
                  onClick={enregistrer}
                  disabled={etat === "saving" || !f.titre.trim() || !(Number(f.placesTotal) > 0)}
                >
                  {etat === "saving" ? "Enregistrement..." : "Enregistrer"}
                </Button>
                <Button variant="ghostDark" onClick={() => setEdition(null)}>
                  Annuler
                </Button>
              </div>
            </div>

            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-white/50">
                Aperçu — tel que le candidat le verra
              </p>
              <div className="mt-3">
                <OffreCard offre={apercu} preview />
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {offres === "loading" && <p className="font-sans text-sm text-white/50">Chargement...</p>}
          {offres === "erreur" && (
            <p className="font-sans text-sm text-white/50">Impossible de charger les offres.</p>
          )}
          {Array.isArray(offres) && offres.length === 0 && !edition && (
            <p className="rounded border border-dashed border-white/15 p-4 font-sans text-sm text-white/50">
              Aucune offre pour l&apos;instant — cliquez sur « Nouvelle offre » pour publier la première.
            </p>
          )}
          {Array.isArray(offres) &&
            offres.map((o) => {
              const badge = badgeOffre(o);
              const metier = ALL_METIERS.find((m) => m.slug === o.metierSlug)?.title ?? o.metierSlug;
              return (
                <div
                  key={o.id}
                  className={`flex flex-wrap items-center justify-between gap-4 rounded border border-white/10 bg-obsidian px-4 py-3 ${
                    o.publiee ? "" : "opacity-60"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sans text-sm font-semibold text-white">
                      {o.drapeau && `${o.drapeau} `}
                      {o.titre}
                      {!o.publiee && (
                        <span className="ml-2 font-mono text-[10px] uppercase text-white/40">brouillon</span>
                      )}
                    </p>
                    <p className="font-mono text-[11px] text-white/40">
                      {metier} · {o.nbCandidatures} candidature{o.nbCandidatures > 1 ? "s" : ""}
                    </p>
                    <p className={`mt-1 font-sans text-xs ${BADGE_TONE[badge.tone]}`}>
                      {badge.emoji} {badge.texte}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-white/50">Pourvues</span>
                    <button
                      type="button"
                      onClick={() => patch(o, { placesPourvues: o.placesPourvues - 1 })}
                      disabled={o.placesPourvues <= 0}
                      className="h-7 w-7 rounded border border-white/20 font-mono text-sm text-white hover:border-accent disabled:opacity-30"
                      aria-label="Retirer une place pourvue"
                    >
                      −
                    </button>
                    <span className="w-14 text-center font-mono text-sm text-white">
                      {o.placesPourvues}/{o.placesTotal}
                    </span>
                    <button
                      type="button"
                      onClick={() => patch(o, { placesPourvues: o.placesPourvues + 1 })}
                      disabled={o.placesPourvues >= o.placesTotal}
                      className="h-7 w-7 rounded border border-white/20 font-mono text-sm text-white hover:border-accent disabled:opacity-30"
                      aria-label="Ajouter une place pourvue"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest">
                    <button
                      type="button"
                      onClick={() => patch(o, { publiee: !o.publiee })}
                      className="text-white/50 hover:text-accent"
                    >
                      {o.publiee ? "Masquer" : "Publier"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEdition({ id: o.id, form: toForm(o) });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="text-accent hover:underline"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => supprimer(o)}
                      className="text-statusRed/70 hover:text-statusRed"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </Reveal>
  );
}
