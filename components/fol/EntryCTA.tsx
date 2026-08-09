"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import RegistrationForm from "@/components/RegistrationForm";

// "Passer le Test d'Entrée" mène désormais au vrai test d'évaluation
// (/evaluation, avec son pipeline complet correction -> validation RH ->
// contrat -> paiement -> matricule) plutôt qu'à un simple formulaire de
// contact — le FOL filtre réellement sur ce test, il doit donc le faire
// passer pour de vrai (corrigé 2026-08-10, avant ça n'ouvrait qu'un
// RegistrationForm qui ne testait rien). "S'inscrire à la Prochaine
// Session" reste un formulaire de contact classique : rejoindre une
// session future n'est pas un test.
export default function EntryCTA() {
  const [sessionFormOpen, setSessionFormOpen] = useState(false);

  if (sessionFormOpen) {
    return (
      <div className="mt-10">
        <RegistrationForm segment="fol" tone="dark" ctaLabel="S'inscrire à la Prochaine Session" />
      </div>
    );
  }

  return (
    <div className="mt-10 flex flex-col gap-4 sm:flex-row">
      <Button variant="dark" href="/evaluation">
        Passer le Test d&apos;Entrée
      </Button>
      <Button variant="dark" onClick={() => setSessionFormOpen(true)}>
        S&apos;inscrire à la Prochaine Session
      </Button>
    </div>
  );
}
