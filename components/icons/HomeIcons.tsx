// Simple, hand-authored single-stroke SVG marks used on the homepage.
// No icon library — every glyph here is a small original line drawing.

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

export function ClipboardCheckIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M8.5 13l2.3 2.3L16 10" />
    </svg>
  );
}

export function BrainGearIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      <path d="M9.5 12.5c0-1.6 1.1-2.6 2.6-2.6" />
    </svg>
  );
}

export function GraduationCapIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M12 3l10 5-10 5L2 8l10-5z" />
      <path d="M6 10.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" />
      <path d="M22 8v6" />
    </svg>
  );
}

export function DoveIcon({ className }: IconProps) {
  // Filled silhouette (not stroked like the other marks) — reads clearly as a
  // bird in flight at small sizes, where a thin single-stroke outline did not.
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 9.5c-1.6.3-3.1 0-4.3-.9.2 2.1-.9 4.1-2.9 5-.1 2.5-2.2 4.4-4.7 4.4-.9 0-1.8-.3-2.5-.7.5.1 1.1.1 1.6-.1-1.4-.4-2.4-1.6-2.6-3 .3.2.7.3 1.1.4-1-.7-1.5-1.9-1.3-3.1.9 1.1 2.3 1.8 3.8 1.8h.1c-.1-.3-.1-.6-.1-.9 0-2 1.6-3.6 3.6-3.6 1 0 2 .4 2.6 1.1.9-.2 1.7-.5 2.4-1-.3.9-.9 1.6-1.6 2 .8-.1 1.5-.3 2.4-.7-.6.8-1.3 1.5-2.1 2.1z" />
    </svg>
  );
}

export function GearPairIcon({ className }: IconProps) {
  // Filled gear-flower silhouettes (solid, not stroked) — matches DoveIcon's
  // solid-shape convention and reads as a clearer "gears" mark at a glance
  // than a thin-stroke outline does.
  const bigTeeth = 8;
  const smallTeeth = 6;
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className} aria-hidden="true">
      <g>
        <circle cx="9" cy="9" r="4.1" />
        {Array.from({ length: bigTeeth }).map((_, i) => (
          <rect
            key={i}
            x="7.7"
            y="2.7"
            width="2.6"
            height="2.3"
            rx="0.7"
            transform={`rotate(${(360 / bigTeeth) * i} 9 9)`}
          />
        ))}
      </g>
      <g opacity="0.92">
        <circle cx="16.5" cy="16.5" r="3" />
        {Array.from({ length: smallTeeth }).map((_, i) => (
          <rect
            key={i}
            x="15.5"
            y="12"
            width="2"
            height="1.8"
            rx="0.5"
            transform={`rotate(${(360 / smallTeeth) * i} 16.5 16.5)`}
          />
        ))}
      </g>
    </svg>
  );
}

export function BadgeDiplomaIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13.5L7 21l5-2.5L17 21l-2-7.5" />
      <path d="M9.5 9l1.7 1.7L14.5 7" />
    </svg>
  );
}

export function MicrophoneIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0014 0" />
      <path d="M12 18v3M9 21h6" />
    </svg>
  );
}

export function BriefcaseIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
      <path d="M3 12h18" />
    </svg>
  );
}

export function StarPersonIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <circle cx="12" cy="8.5" r="3" />
      <path d="M5.5 20c0-3.3 2.9-5.8 6.5-5.8s6.5 2.5 6.5 5.8" />
      <path d="M3.5 4.5l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5z" />
      <path d="M20.5 4.5l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5z" />
    </svg>
  );
}

export function HandshakeIcon({ className }: IconProps) {
  // Two forearms meeting in a grip — a simplified but legible handshake mark
  // (a fully literal clasped-hands drawing reads as noise at small icon
  // scale, so this keeps the "two sides meeting in the middle" gesture
  // recognizable without over-detailing).
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 8.3l4.6 3.3a1.9 1.9 0 002.6-.3l1-1.2" />
      <path d="M21.5 8.3L16.9 11.6a1.9 1.9 0 01-2.6-.3l-1-1.2" />
      <path d="M7.1 11.6l2.9 3.5a1.5 1.5 0 002.2.2l.4-.4" />
      <path d="M16.9 11.6l-2.9 3.5a1.5 1.5 0 01-2.2.2" />
      <circle cx="12" cy="12.4" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
