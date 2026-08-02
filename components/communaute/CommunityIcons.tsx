// Simple, hand-authored single-stroke SVG marks used on the /communaute page.
// No icon library — every glyph here is a small original line drawing,
// consistent with components/icons/HomeIcons.tsx.

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
