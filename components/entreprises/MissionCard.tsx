"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
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
    <div className="flex flex-col rounded border border-primary/10 bg-white p-6 shadow-sm">
      <h3 className="font-display text-lg font-bold text-primary">{title}</h3>
      <p className="mt-1 font-sans text-sm italic text-muted">{subtitle}</p>
      <p className="mt-4 font-sans text-sm text-ink">{description}</p>

      <div className="mt-5">
        <Badge tone={available ? "success" : "accent"}>
          {available ? "Disponible pour commencer" : "En attente de disponibilité"}
        </Badge>
        <p className="mt-2 font-mono text-xs text-muted">{statusDetail}</p>
      </div>

      <div className="mt-6">
        <Button variant="primary" onClick={openForm}>
          {ctaLabel}
        </Button>
      </div>

      {formOpen && (
        <div ref={formRef} className="mt-6">
          <RegistrationForm segment={segment} ctaLabel={ctaLabel} tone="light" />
        </div>
      )}
    </div>
  );
}
