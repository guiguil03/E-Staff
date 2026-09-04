"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// Modale générique réutilisable (thème obsidian/or, cohérent avec le reste
// du funnel Examens) — fermeture par Échap, clic sur le fond, ou bouton ✕.
//
// Rendue dans un portail vers document.body plutôt qu'à sa place dans
// l'arbre : DiplomaCard est toujours utilisée à l'intérieur d'un <Reveal>,
// qui anime son apparition via `transform` (translate-y) — or un `transform`
// sur un ancêtre crée un nouveau bloc de positionnement pour ses descendants
// `position: fixed` (spec CSS), donc sans portail le fond de la modale ne
// couvrait que la carte elle-même au lieu de tout l'écran (bug constaté en
// testant réellement dans un navigateur, pas visible à la simple lecture du
// code — voir clic en dehors de la modale qui ne la fermait pas).
export default function Modal({ open, onClose, title, children }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-8 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded border border-accent/25 bg-obsidianCard p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 font-sans text-lg text-white/50 transition-colors hover:text-accent"
        >
          ✕
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}
