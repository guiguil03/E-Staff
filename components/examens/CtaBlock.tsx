"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import RegistrationForm from "@/components/RegistrationForm";

// Bottom framed CTA — light gray background, per 03-reference.png. Reveals a
// general, unsegmented RegistrationForm for candidates who aren't sure yet
// which certification track fits them.
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
    <div className="rounded border border-primary/10 bg-primary/5 p-8 text-center sm:p-12">
      <h2 className="font-display text-2xl font-bold text-primary sm:text-3xl">
        Prêt à transformer votre potentiel en réussite officielle ?
      </h2>
      <p className="mx-auto mt-4 max-w-2xl font-sans text-sm text-muted sm:text-base">
        Pour garantir un accompagnement sur-mesure et orienter votre
        préparation vers le programme d&apos;excellence qui vous correspond,
        la première étape commence ici.
      </p>

      <div className="mt-6 flex justify-center">
        <Button variant="primary" onClick={openForm}>
          Passer mon test de niveau initial →
        </Button>
      </div>

      {formOpen && (
        <div ref={formRef} className="mx-auto mt-8 max-w-2xl text-left">
          <RegistrationForm
            segment="examens-general"
            ctaLabel="Passer mon test de niveau initial"
            tone="light"
          />
        </div>
      )}
    </div>
  );
}
