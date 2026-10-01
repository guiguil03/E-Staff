"use client";

import { badgeOffre, formatDateLimite, type OffreEmploi } from "@/components/studio-metier/offres";

const BADGE_TONE = {
  vert: "border-statusGreen/40 bg-statusGreen/10 text-statusGreen",
  orange: "border-statusOrange/40 bg-statusOrange/10 text-statusOrange",
  rouge: "border-statusRed/40 bg-statusRed/10 text-statusRed",
} as const;

const BAR_TONE = {
  vert: "bg-statusGreen",
  orange: "bg-statusOrange",
  rouge: "bg-statusRed",
} as const;

interface OffreCardProps {
  offre: OffreEmploi;
  selected?: boolean;
  /** Clic sur « Postuler » (offre ouverte, sans lien WhatsApp). */
  onPostuler?: (offre: OffreEmploi) => void;
  /** Clic sur « Rejoindre la liste d'attente » (offre clôturée). */
  onListeAttente?: (offre: OffreEmploi) => void;
  /** Aperçu du Portail RH : boutons affichés mais inactifs. */
  preview?: boolean;
}

// Carte d'offre d'emploi de la vitrine Studio Métier — structure demandée
// par la cliente le 2026-09-19 : badge de disponibilité, informations de
// l'offre, jauge de recrutement, bouton d'action qui se désactive tout seul
// quand l'offre est complète, expirée ou fermée par la RH.
export default function OffreCard({ offre, selected = false, onPostuler, onListeAttente, preview = false }: OffreCardProps) {
  const badge = badgeOffre(offre);
  const ouverte = offre.statut !== "cloture";

  return (
    <article
      className={`rounded border bg-[linear-gradient(180deg,#1c2542_0%,#131a2a_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_6px_14px_rgba(0,0,0,0.45)] transition-colors sm:p-6 ${
        selected ? "border-accent" : "border-white/10"
      } ${ouverte ? "" : "opacity-80"}`}
    >
      <h4 className="font-display text-lg font-bold leading-snug text-white sm:text-xl">
        {offre.drapeau && <span className="mr-2">{offre.drapeau}</span>}
        {offre.titre}
      </h4>
      {offre.modalites.length > 0 && (
        <p className="mt-1 font-sans text-sm text-white/60">{offre.modalites.join(" | ")}</p>
      )}

      <p
        className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-sans text-sm font-semibold ${BADGE_TONE[badge.tone]}`}
      >
        <span aria-hidden="true">{badge.emoji}</span>
        {badge.tone === "vert" ? `Disponibilité : ${badge.texte}` : badge.texte}
      </p>

      <div className="mt-4">
        <div className="flex items-center justify-between font-sans text-xs text-white/60">
          <span>📊 {ouverte ? "Recrutement en cours" : "Recrutement"}</span>
          <span>
            {offre.placesPourvues}/{offre.placesTotal} postes attribués
          </span>
        </div>
        <div
          className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={offre.tauxRemplissage}
          aria-label={`Recrutement : ${offre.tauxRemplissage} % des postes attribués`}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${BAR_TONE[badge.tone]}`}
            style={{ width: `${offre.tauxRemplissage}%` }}
          />
        </div>
      </div>

      <dl className="mt-4 space-y-2 font-sans text-sm leading-relaxed">
        {offre.projet && (
          <div>
            <dt className="inline font-semibold text-white">Projet : </dt>
            <dd className="inline text-white/70">{offre.projet}</dd>
          </div>
        )}
        {offre.remuneration && (
          <div>
            <dt className="inline font-semibold text-white">Rémunération : </dt>
            <dd className="inline text-white/70">{offre.remuneration}</dd>
          </div>
        )}
        {offre.prerequis && (
          <div>
            <dt className="inline font-semibold text-white">Prérequis : </dt>
            <dd className="inline text-white/70">{offre.prerequis}</dd>
          </div>
        )}
        {offre.dateLimite && ouverte && (
          <div>
            <dt className="inline font-semibold text-white">Candidatures jusqu&apos;au : </dt>
            <dd className="inline text-white/70">{formatDateLimite(offre.dateLimite)}</dd>
          </div>
        )}
      </dl>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {ouverte ? (
          offre.lienWhatsapp && !preview ? (
            <a
              href={offre.lienWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-statusGreen px-6 py-3 font-sans text-sm font-bold uppercase tracking-wide text-obsidian transition-colors hover:bg-statusGreen/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              Postuler à cette offre <span aria-hidden="true">→</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => onPostuler?.(offre)}
              disabled={preview}
              className="inline-flex items-center gap-2 rounded-full bg-statusGreen px-6 py-3 font-sans text-sm font-bold uppercase tracking-wide text-obsidian transition-colors hover:bg-statusGreen/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:cursor-default"
            >
              Postuler à cette offre <span aria-hidden="true">→</span>
            </button>
          )
        ) : (
          <>
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center rounded-full bg-white/10 px-6 py-3 font-sans text-sm font-bold uppercase tracking-wide text-white/40"
            >
              Offre clôturée
            </button>
            <button
              type="button"
              onClick={() => onListeAttente?.(offre)}
              disabled={preview}
              className="font-sans text-sm text-white/60 underline decoration-white/30 underline-offset-4 hover:text-accent disabled:cursor-default"
            >
              Rejoindre la liste d&apos;attente
            </button>
          </>
        )}
      </div>
    </article>
  );
}
