// Simple, hand-authored single-stroke SVG marks for the "Promesses d'e-Staf"
// panel. No icon library — every glyph here is a small original line drawing,
// styled to sit inside a thin gold circle (same convention as
// components/fol/PillarIcons.tsx and components/icons/HomeIcons.tsx).

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

// Locaux équipés & sécurisés — a shield.
export function ShieldIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4.5" />
    </svg>
  );
}

// Encadrement managérial rigoureux — a gauge/dial.
export function GaugeIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M4 17a8 8 0 1116 0" />
      <path d="M12 17l4-5.2" />
      <circle cx="12" cy="17" r="1.1" fill="currentColor" stroke="none" />
      <path d="M2 20h20" />
    </svg>
  );
}

// Maîtrise des outils & CRM — layered squares.
export function LayeredSquaresIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <rect x="4" y="4" width="12" height="12" rx="1.5" />
      <rect x="8" y="8" width="12" height="12" rx="1.5" />
    </svg>
  );
}

// Transparence & confidentialité tarifaire — a lock.
export function LockIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
      <circle cx="12" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Pilotage & reporting hebdomadaire — a bar chart.
export function BarChartIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M5 20V12M12 20V6M19 20v-9" />
      <path d="M3 20h18" />
    </svg>
  );
}

// Zéro turnover / remplacement garanti — a refresh loop.
export function RefreshLoopIcon({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M4.5 12a7.5 7.5 0 0112.8-5.3L20 9" />
      <path d="M20 4.5V9h-4.5" />
      <path d="M19.5 12a7.5 7.5 0 01-12.8 5.3L4 15" />
      <path d="M4 19.5V15h4.5" />
    </svg>
  );
}
