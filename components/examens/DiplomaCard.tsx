"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import RegistrationForm from "@/components/RegistrationForm";

interface ActionConfig {
  /** Text shown on the button itself. */
  label: string;
  /** Passed through as the RegistrationForm's own submit-button label. */
  ctaLabel: string;
}

interface DiplomaCardProps {
  /** Short lines rendered stacked inside the circular badge, e.g. ["DELF", "DALF"]. */
  badgeLines: string[];
  title: string;
  /** Italic gray tagline under the title. */
  subtitle: string;
  /** Optional "Cibles" line — used for the DFP sub-programs. */
  cibles?: string;
  mission: string;
  statusLabel: string;
  /** Optional parenthetical detail shown under the status badge. */
  statusDetail?: string;
  statusTone: "success" | "accent";
  segment: string;
  actions: [ActionConfig, ActionConfig];
  id?: string;
  className?: string;
}

export default function DiplomaCard({
  badgeLines,
  title,
  subtitle,
  cibles,
  mission,
  statusLabel,
  statusDetail,
  statusTone,
  segment,
  actions,
  id,
  className = "",
}: DiplomaCardProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [activeCtaLabel, setActiveCtaLabel] = useState(actions[0].ctaLabel);
  const formRef = useRef<HTMLDivElement>(null);

  function openForm(ctaLabel: string) {
    setActiveCtaLabel(ctaLabel);
    setFormOpen(true);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  // The shared Badge component's "success" tone (emerald green) loses too
  // much contrast on the obsidian background, so status pills are rendered
  // as plain styled spans here instead — gold for a dated cohort, neutral
  // white for open-ended enrollment — without touching components/ui/Badge.tsx.
  const statusToneClasses =
    statusTone === "accent"
      ? "border-accent/40 bg-accent/10 text-accent"
      : "border-white/25 bg-white/10 text-white";

  return (
    <div
      id={id}
      className={`flex flex-col rounded border border-accent/25 bg-obsidianCard p-6 ${className}`.trim()}
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border border-accent/40 bg-obsidian text-center leading-tight text-accent"
        >
          {badgeLines.map((line) => (
            <span key={line} className="font-mono text-[11px] font-bold tracking-wide">
              {line}
            </span>
          ))}
        </span>
        <div>
          <h3 className="font-display text-xl font-bold text-accent">{title}</h3>
          <p className="mt-1 font-sans text-sm italic text-white/50">{subtitle}</p>
        </div>
      </div>

      <div className="mt-5 space-y-2.5 font-sans text-sm text-white/80">
        {cibles && (
          <div className="flex gap-2">
            <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent/50" />
            <p>
              <span className="font-semibold text-accent">Cibles : </span>
              {cibles}
            </p>
          </div>
        )}
        <div className="flex gap-2">
          <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent/50" />
          <p>
            <span className="font-semibold text-accent">Mission : </span>
            {mission}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-xs font-medium uppercase tracking-wider ${statusToneClasses}`}
        >
          {statusLabel}
        </span>
        {statusDetail && (
          <p className="mt-2 font-mono text-xs text-white/40">{statusDetail}</p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button variant="dark" onClick={() => openForm(actions[0].ctaLabel)}>
          {actions[0].label}
        </Button>
        <Button variant="ghostDark" onClick={() => openForm(actions[1].ctaLabel)}>
          {actions[1].label}
        </Button>
      </div>

      {formOpen && (
        <div ref={formRef} className="mt-6">
          <RegistrationForm segment={segment} ctaLabel={activeCtaLabel} tone="dark" />
        </div>
      )}
    </div>
  );
}
