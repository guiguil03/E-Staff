// Simple, hand-authored single-stroke SVG marks used on the Studio Métier
// page (dark/elite universe). Same technique as components/icons/HomeIcons.tsx
// — no icon library, every glyph here is a small original line drawing.

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

export function HeadsetIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M4 13v-1a8 8 0 0116 0v1" />
      <rect x="3" y="13" width="4.2" height="6.5" rx="1.6" />
      <rect x="16.8" y="13" width="4.2" height="6.5" rx="1.6" />
      <path d="M19 19.5v.5a2 2 0 01-2 2h-2.5" />
    </svg>
  );
}

export function TargetIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function HandshakeIcon({ className }: IconProps) {
  // Two interlocking rings — abstraction for "meeting of two parties" that
  // stays legible at small icon scale (mirrors HomeIcons' HandshakeIcon).
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <circle cx="9.3" cy="12" r="6" />
      <circle cx="14.7" cy="12" r="6" />
    </svg>
  );
}

export function EnvelopeIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3.6 6.5L12 13l8.4-6.5" />
    </svg>
  );
}

export function ChatBubblesIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M3.5 6.5h12a2 2 0 012 2v5a2 2 0 01-2 2h-6l-4 3v-3h-2a2 2 0 01-2-2v-5a2 2 0 012-2z" />
      <path d="M9 3.5h9a2 2 0 012 2v5a2 2 0 01-1 1.7" />
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

export function MegaphoneIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M3 9.5v5h2.6l9.4 3.8V5.7L5.6 9.5H3z" />
      <path d="M17.5 9a4 4 0 010 6" />
      <path d="M6.5 14.5l1 4.5" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3.2 2" />
    </svg>
  );
}

export function DevicePhoneIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <rect x="6.5" y="2" width="11" height="20" rx="2.2" />
      <path d="M10 5h4" />
      <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
      <path d="M15.5 8.5a3 3 0 010 4.2" />
    </svg>
  );
}

export function PenIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M4 20l1-4.3L14.7 5.9l3.4 3.4L8.3 19.1 4 20z" />
      <path d="M13 7.6l3.4 3.4" />
    </svg>
  );
}
