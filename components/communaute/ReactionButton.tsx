"use client";

import { useState } from "react";
import { HeartIcon } from "./CommunityIcons";

interface ReactionButtonProps {
  /** Starting reaction count for this example post/testimonial. */
  initialCount?: number;
  /** Pré-coche le bouton (ex: post déjà liké par ce visiteur selon le
   * localStorage) — n'affecte que l'état visuel initial, pas le compteur. */
  initialActive?: boolean;
  /** Accessible label, e.g. "Réagir à la publication de Fara". */
  label: string;
  /** Appelé après le toggle local avec le nouvel état (true = liké). Si la
   * promesse résout un nombre, le compteur affiché se resynchronise dessus
   * — utilisé pour les vrais posts médias, où le serveur (pas ce
   * composant) est la source de vérité du compteur partagé entre
   * visiteurs. Omis par défaut : comportement 100% local inchangé
   * (témoignages, posts d'exemple). */
  onToggle?: (active: boolean) => void | Promise<number | void>;
}

// "Like" button, open to every visitor, no account required. Par défaut
// purement local (compteur reset au reload) — voir `onToggle` pour les cas
// où le compteur doit être réel et partagé (MediaWall).
// Styled for the dark/elite (obsidian) universe: gold accent on dark cards.
export default function ReactionButton({
  initialCount = 0,
  initialActive = false,
  label,
  onToggle,
}: ReactionButtonProps) {
  const [active, setActive] = useState(initialActive);
  const [count, setCount] = useState(initialCount);

  async function toggle() {
    const next = !active;
    setActive(next);
    setCount((c) => c + (next ? 1 : -1));
    if (onToggle) {
      const result = await onToggle(next);
      if (typeof result === "number") setCount(result);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={active}
      aria-label={label}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-xs font-medium transition-colors duration-150 ${
        active
          ? "border-accent bg-accent/15 text-accent"
          : "border-accent/30 bg-obsidian/60 text-white/70 hover:border-accent hover:text-accent"
      }`}
    >
      <HeartIcon className="h-4 w-4" filled={active} />
      <span>{count}</span>
    </button>
  );
}
