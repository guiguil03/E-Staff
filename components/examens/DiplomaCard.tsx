"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
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

  return (
    <div
      id={id}
      className={`flex flex-col rounded border border-primary/10 bg-white p-6 shadow-sm ${className}`.trim()}
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border border-primary/20 bg-background text-center leading-tight text-primary"
        >
          {badgeLines.map((line) => (
            <span key={line} className="font-mono text-[11px] font-bold tracking-wide">
              {line}
            </span>
          ))}
        </span>
        <div>
          <h3 className="font-display text-xl font-bold text-primary">{title}</h3>
          <p className="mt-1 font-sans text-sm italic text-muted">{subtitle}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3 font-sans text-sm text-ink">
        {cibles && (
          <p>
            <span className="font-semibold text-primary">Cibles : </span>
            {cibles}
          </p>
        )}
        <p>
          <span className="font-semibold text-primary">Mission : </span>
          {mission}
        </p>
      </div>

      <div className="mt-5">
        <Badge tone={statusTone}>{statusLabel}</Badge>
        {statusDetail && (
          <p className="mt-2 font-mono text-xs text-muted">{statusDetail}</p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button variant="primary" onClick={() => openForm(actions[0].ctaLabel)}>
          {actions[0].label}
        </Button>
        <Button variant="ghost" onClick={() => openForm(actions[1].ctaLabel)}>
          {actions[1].label}
        </Button>
      </div>

      {formOpen && (
        <div ref={formRef} className="mt-6">
          <RegistrationForm segment={segment} ctaLabel={activeCtaLabel} tone="light" />
        </div>
      )}
    </div>
  );
}
