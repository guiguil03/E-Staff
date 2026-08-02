"use client";

import { useState } from "react";
import { HeartIcon } from "./CommunityIcons";

interface ReactionButtonProps {
  /** Starting reaction count for this example post/testimonial. */
  initialCount?: number;
  /** Accessible label, e.g. "Réagir à la publication de Fara". */
  label: string;
}

// Local-state-only "like" button — open to every visitor, no account
// required. There is no backend yet, so the count only lives in this
// component and resets on reload; that is expected for this phase.
export default function ReactionButton({ initialCount = 0, label }: ReactionButtonProps) {
  const [active, setActive] = useState(false);
  const [count, setCount] = useState(initialCount);

  function toggle() {
    setActive((prev) => {
      const next = !prev;
      setCount((c) => c + (next ? 1 : -1));
      return next;
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={active}
      aria-label={label}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-xs font-medium transition-colors duration-150 ${
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-primary/20 bg-white text-muted hover:border-accent hover:text-accent"
      }`}
    >
      <HeartIcon className="h-4 w-4" filled={active} />
      <span>{count}</span>
    </button>
  );
}
