"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Button from "@/components/ui/Button";
import RegistrationForm from "@/components/RegistrationForm";
import { PROGRAM_TYPE_OPTIONS } from "@/components/examens/programTypes";

export interface ProgrammeDetails {
  /** e.g. "Groupe de 5 apprenants" */
  format: string;
  /** e.g. "26 septembre 2026" — omis quand les inscriptions sont ouvertes en
   * continu sans date fixe (ex. TEF Canada). */
  prochaineVague?: string;
  /** e.g. "1h par jour" */
  frequence: string;
  /** e.g. "5 semaines" */
  duree: string;
  /** e.g. ["6h", "7h", "8h", ...] */
  creneaux: string[];
  /** e.g. "50 €" */
  tarif: string;
}

interface FormationDetailsModalProps {
  badgeLines: string[];
  title: string;
  subtitle: string;
  details: ProgrammeDetails;
  segment: string;
  ctaLabel: string;
  onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/10 py-3">
      <span className="font-mono text-xs uppercase tracking-widest text-white/50">
        {label}
      </span>
      <span className="text-right font-sans text-sm font-medium text-white">{value}</span>
    </div>
  );
}

// Rendu via portail dans document.body : comme ClientMissionModal, pour que
// l'overlay plein écran ne soit pas cassé par un ancestor Reveal (transform
// CSS -> nouveau containing block pour position:fixed).
export default function FormationDetailsModal({
  badgeLines,
  title,
  subtitle,
  details,
  segment,
  ctaLabel,
  onClose,
}: FormationDetailsModalProps) {
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded border border-accent/25 bg-obsidianCard p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border border-accent/40 bg-obsidian text-center leading-tight text-accent"
            >
              {badgeLines.map((line) => (
                <span key={line} className="font-mono text-[10px] font-bold tracking-wide">
                  {line}
                </span>
              ))}
            </span>
            <div>
              <h3 className="font-display text-lg font-bold text-accent">{title}</h3>
              <p className="mt-1 font-sans text-sm italic text-white/50">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="shrink-0 rounded border border-white/15 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-white/50 hover:border-white/30 hover:text-white"
          >
            Fermer
          </button>
        </div>

        <div className="mt-2">
          <DetailRow label="Format" value={details.format} />
          <DetailRow
            label="Prochaine vague"
            value={details.prochaineVague ?? "Sessions en continu — rejoignez la prochaine cohorte"}
          />
          <DetailRow label="Fréquence" value={details.frequence} />
          <DetailRow label="Durée" value={details.duree} />
          <DetailRow label="Créneaux au choix" value={details.creneaux.join(" · ")} />
          <div className="flex items-baseline justify-between gap-4 py-3">
            <span className="font-mono text-xs uppercase tracking-widest text-white/50">
              Tarif
            </span>
            <span className="text-right font-display text-xl font-bold text-accent">
              {details.tarif}
            </span>
          </div>
        </div>

        {!showForm ? (
          <div className="mt-4">
            <Button variant="dark" onClick={() => setShowForm(true)}>
              {ctaLabel}
            </Button>
          </div>
        ) : (
          <div className="mt-4">
            <RegistrationForm
              segment={segment}
              ctaLabel={ctaLabel}
              tone="dark"
              showCv
              typeFormationOptions={PROGRAM_TYPE_OPTIONS}
              defaultTypeFormation={segment}
            />
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
