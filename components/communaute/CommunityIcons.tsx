// Simple, hand-authored single-stroke SVG marks used on the /communaute page.
// No icon library — every glyph here is a small original line drawing,
// consistent with components/icons/HomeIcons.tsx and components/fol/PillarIcons.tsx.

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

interface HeartIconProps extends IconProps {
  /** Filled (reacted) vs. outline (not reacted) state. */
  filled?: boolean;
}

export function HeartIcon({ className, filled = false }: HeartIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20.3s-7.3-4.5-9.3-9.2C1.4 7.9 3.2 5.1 6.3 5.1c2 0 3.4 1.1 4.3 2.4.9-1.3 2.3-2.4 4.3-2.4 3.1 0 4.9 2.8 3.6 6-2 4.7-9.3 9.2-9.3 9.2z" />
    </svg>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="9" rx="2" />
      <path d="M8 10.5V8a4 4 0 118 0v2.5" />
      <circle cx="12" cy="15" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function UploadIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M12 15V4M12 4L8 8M12 4l4 4" />
      <path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
    </svg>
  );
}

interface StarIconProps extends IconProps {
  filled?: boolean;
}

export function StarIcon({ className, filled = true }: StarIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.6 1-5.8-4.2-4.1 5.8-.8L12 3.5z" />
    </svg>
  );
}

export function ShareIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <circle cx="18" cy="5" r="2.2" />
      <circle cx="6" cy="12" r="2.2" />
      <circle cx="18" cy="19" r="2.2" />
      <path d="M8 10.8l8-4.4M8 13.2l8 4.4" />
    </svg>
  );
}

export function CommentIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M4 5.5h16v10H9l-4 3.5v-3.5H4v-10z" />
    </svg>
  );
}

export function MedalIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <circle cx="12" cy="9" r="5.5" />
      <path d="M9 13.5L7 20l5-2.3L17 20l-2-6.5" />
    </svg>
  );
}

export function PlusCircleIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}
