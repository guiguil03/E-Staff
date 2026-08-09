"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import RegistrationForm from "@/components/RegistrationForm";

interface LotCardProps {
  name: string;
  mission: string;
  trainingEndDate: string;
  segment: string;
}

// A single "Squad Long Terme" lot — status badge plus two actions that each
// reveal the same RegistrationForm, tagged with a distinct CTA label so the
// (currently backend-less) submission still records intent. Mirrors the
// reveal-a-form pattern used by components/examens/DiplomaCard.tsx.
export default function LotCard({ name, mission, trainingEndDate, segment }: LotCardProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [activeCtaLabel, setActiveCtaLabel] = useState("Collaborer (Dispo Immédiate)");
  const formRef = useRef<HTMLDivElement>(null);

  function openForm(ctaLabel: string) {
    setActiveCtaLabel(ctaLabel);
    setFormOpen(true);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  return (
    <div className="flex flex-col rounded border border-white/10 bg-obsidianCard p-6">
      <h3 className="font-display text-lg font-bold text-white">{name}</h3>
      <p className="mt-3 font-sans text-sm text-white/70">{mission}</p>

      <div className="mt-5">
        <Badge tone="accent">En attente de déploiement</Badge>
        <p className="mt-2 font-mono text-xs text-white/50">
          Fin de formation : {trainingEndDate}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button variant="dark" onClick={() => openForm("Collaborer (Dispo Immédiate)")}>
          Collaborer (Dispo Immédiate)
        </Button>
        <Button variant="ghostDark" onClick={() => openForm(`Réserver pour le ${trainingEndDate}`)}>
          Réserver pour le {trainingEndDate}
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
