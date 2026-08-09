import type { ReactNode } from "react";

type Tone = "primary" | "accent" | "success" | "teal";

const TONE_CLASSES: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary border-primary/30",
  accent: "bg-accent/10 text-accent border-accent/30",
  success: "bg-success/10 text-success border-success/30",
  teal: "bg-teal/10 text-teal border-teal/30",
};

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

// Small mono pill — used for language-level badges (e.g. "B1", "C1").
export default function Badge({ children, tone = "primary", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-xs font-medium uppercase tracking-wider ${TONE_CLASSES[tone]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
