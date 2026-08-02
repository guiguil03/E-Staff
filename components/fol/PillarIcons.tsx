// Simple, hand-authored single-stroke SVG marks for the FOL "Piliers
// Stratégiques" panel. No icon library — every glyph here is a small
// original line drawing, styled to sit inside a thin gold circle.

interface IconProps {
  className?: string;
}

const BASE_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// Présenter avec charisme — a wand with a sparkle at its tip.
export function WandIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M4 20L15 9" />
      <path d="M17 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
      <path d="M19.5 14.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" />
    </svg>
  );
}

// Diriger avec autorité — a crown.
export function CrownIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M4 17h16l-1.4-7-4.1 3.2L12 7l-2.5 6.2L5.4 10 4 17z" />
      <path d="M4 20h16" />
    </svg>
  );
}

// Négocier avec élégance — a balance scale.
export function ScaleIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M12 3v16" />
      <path d="M6 21h12" />
      <path d="M4 8h6M14 8h6" />
      <path d="M4 8l-2.4 5a2.8 2.8 0 005.8 0z" />
      <path d="M20 8l-2.4 5a2.8 2.8 0 005.8 0z" />
    </svg>
  );
}

// Répondre avec brio — a lightning bolt.
export function BoltIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  );
}

// Incarner la posture PDG — a person-in-suit silhouette.
export function PersonSuitIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <circle cx="12" cy="7" r="3.2" />
      <path d="M6 21v-2.5A5.5 5.5 0 0111.5 13h1A5.5 5.5 0 0118 18.5V21" />
      <path d="M9.5 14.3L12 17l2.5-2.7" />
    </svg>
  );
}
