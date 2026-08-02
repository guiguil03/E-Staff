"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import RegistrationForm from "@/components/RegistrationForm";

type Intent = "test" | "session";

// Two CTAs that both reveal the shared RegistrationForm in dark tone once
// clicked. The form component already carries its own note that results
// are never communicated immediately, so it is not duplicated here.
export default function EntryCTA() {
  const [intent, setIntent] = useState<Intent | null>(null);

  if (intent) {
    const ctaLabel =
      intent === "test" ? "Passer le Test d'Entrée" : "S'inscrire à la Prochaine Session";
    return (
      <div className="mt-10">
        <RegistrationForm segment="fol" tone="dark" ctaLabel={ctaLabel} />
      </div>
    );
  }

  return (
    <div className="mt-10 flex flex-col gap-4 sm:flex-row">
      <Button variant="dark" onClick={() => setIntent("test")}>
        Passer le Test d&apos;Entrée
      </Button>
      <Button variant="dark" onClick={() => setIntent("session")}>
        S&apos;inscrire à la Prochaine Session
      </Button>
    </div>
  );
}
