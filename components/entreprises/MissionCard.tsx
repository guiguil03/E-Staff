"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import RegistrationForm from "@/components/RegistrationForm";

interface MissionCardProps {
  title: string;
  subtitle: string;
  description: string;
  available: boolean;
  statusDetail: string;
  ctaLabel: string;
  segment: string;
}

// A single punctual mission/prestation — green badge when available now,
// gold/amber badge when waiting for a slot. One action reveals the same
// no-backend-yet RegistrationForm used across the site.
export default function MissionCard({
  title,
  subtitle,
  description,
  available,
  statusDetail,
  ctaLabel,
  segment,
}: MissionCardProps) {
  const [formOpen, setFormOpen] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  function openForm() {
    setFormOpen(true);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  return (
    <div className="flex flex-col rounded border border-white/10 bg-obsidianCard p-6">
      <h3 className="font-display text-lg font-bold text-white">{title}</h3>
      <p className="mt-1 font-sans text-sm italic text-white/50">{subtitle}</p>
      <p className="mt-4 font-sans text-sm text-white/70">{description}</p>

      <div className="mt-5">
        {/* The shared Badge component's "success" (emerald) tone loses too
         * much contrast on the obsidian background, so status pills are
         * rendered as plain styled spans here instead — gold for "waiting",
         * neutral white for "available now" — matching the pattern already
         * used in components/examens/DiplomaCard.tsx. */}
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-xs font-medium uppercase tracking-wider ${
            available
              ? "border-white/25 bg-white/10 text-white"
              : "border-accent/40 bg-accent/10 text-accent"
          }`}
        >
          {available ? "Disponible pour commencer" : "En attente de disponibilité"}
        </span>
        <p className="mt-2 font-mono text-xs text-white/50">{statusDetail}</p>
      </div>

      <div className="mt-6">
        <Button variant="dark" onClick={openForm}>
          {ctaLabel}
        </Button>
      </div>

      {formOpen && (
        <div ref={formRef} className="mt-6">
          <RegistrationForm segment={segment} ctaLabel={ctaLabel} tone="dark" />
        </div>
      )}
    </div>
  );
}
