"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import RegistrationForm from "@/components/RegistrationForm";

// Bottom framed CTA — dark/elite obsidian panel, matching the FOL / Studio
// Métier convention. Reveals a general, unsegmented RegistrationForm for
// candidates who aren't sure yet which certification track fits them.
export default function CtaBlock() {
  const [formOpen, setFormOpen] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  function openForm() {
    setFormOpen(true);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  return (
    <div className="rounded border border-accent/25 bg-obsidianCard p-8 text-center sm:p-12">
      <h2 className="font-display text-2xl font-bold text-accent sm:text-3xl">
        Prêt à transformer votre potentiel en réussite officielle ?
      </h2>
      <p className="mx-auto mt-4 max-w-2xl font-sans text-sm text-white/70 sm:text-base">
        Pour garantir un accompagnement sur-mesure et orienter votre
        préparation vers le programme d&apos;excellence qui vous correspond,
        la première étape commence ici.
      </p>

      <div className="mt-6 flex justify-center">
        <Button variant="dark" onClick={openForm} className="rounded-full px-8">
          Passer mon test de niveau initial →
        </Button>
      </div>

      {formOpen && (
        <div ref={formRef} className="mx-auto mt-8 max-w-2xl text-left">
          <RegistrationForm
            segment="examens-general"
            ctaLabel="Passer mon test de niveau initial"
            tone="dark"
          />
        </div>
      )}
    </div>
  );
}
