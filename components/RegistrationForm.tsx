"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { apiPost, apiUpload, ApiError } from "@/lib/api";
import type { ProgramTypeOption } from "@/components/examens/programTypes";

interface RegistrationFormProps {
  /** Identifies which funnel submitted this — e.g. "delf-dalf", "tef-canada",
   * "dfp", "fol", or a métier slug like "teleconseiller". */
  segment: string;
  ctaLabel?: string;
  /** Pass "dark" to render on an obsidian background (FOL / Studio Métier). */
  tone?: "light" | "dark";
  className?: string;
  /** When provided, renders a mandatory "Type de formation" dropdown — only
   * the Examens funnel uses this (see DiplomaCard.tsx). */
  typeFormationOptions?: ProgramTypeOption[];
  /** Pre-selected value in typeFormationOptions, e.g. the program whose card
   * was clicked — stays changeable by the candidate. */
  defaultTypeFormation?: string;
  /** When true, renders an optional CV (PDF) upload input next to the "Type
   * de formation" dropdown — only the Examens funnel uses this. */
  showCv?: boolean;
  /** Studio Métier : offre d'emploi précise visée (voir OffreEmploi). */
  offreEmploiId?: string;
  /** Studio Métier : candidature en liste d'attente sur une offre clôturée. */
  listeAttente?: boolean;
}

export default function RegistrationForm({
  segment,
  ctaLabel = "Passer le test",
  tone = "light",
  className = "",
  typeFormationOptions,
  defaultTypeFormation,
  showCv = false,
  offreEmploiId,
  listeAttente = false,
}: RegistrationFormProps) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [typeFormation, setTypeFormation] = useState(
    defaultTypeFormation ?? typeFormationOptions?.[0]?.value ?? ""
  );
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDark = tone === "dark";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const body: Record<string, unknown> = { segment, firstName, email, phone };
      if (typeFormationOptions) body.typeFormation = typeFormation;
      if (offreEmploiId) {
        body.offreEmploiId = offreEmploiId;
        body.listeAttente = listeAttente;
      }
      const res = await apiPost<{ id: string }>("/registrations", body);
      if (cvFile) {
        // Dépôt facultatif — un échec ici ne doit pas empêcher l'inscription
        // d'être considérée comme réussie (même principe que le CV du test
        // de recrutement, voir EvaluationFlow.tsx).
        const formData = new FormData();
        formData.append("cv", cvFile, cvFile.name);
        await apiUpload(`/registrations/${res.id}/cv`, formData).catch(() => {});
      }
      setStatus("sent");
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : null);
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div
        className={`rounded border p-6 ${
          isDark
            ? "border-accent/40 bg-obsidianCard text-white"
            : "border-success/30 bg-success/5 text-ink"
        } ${className}`.trim()}
      >
        <p className="font-display text-lg mb-2">Merci, {firstName || "votre inscription"} est enregistrée.</p>
        <p className={`text-sm ${isDark ? "text-white/70" : "text-muted"}`}>
          Veuillez passer le test en bas de la page. Le résultat ne vous
          sera pas communiqué immédiatement — vous serez recontacté(e) une
          fois l&apos;évaluation traitée.
        </p>
      </div>
    );
  }

  const labelClass = `block text-sm font-medium mb-1 ${
    isDark ? "text-white/80" : "text-ink"
  }`;
  const inputClass = `w-full rounded border px-4 py-2 font-sans text-sm ${
    isDark
      ? "border-white/20 bg-obsidian text-white placeholder:text-white/30 focus:border-accent"
      : "border-muted/30 bg-white text-ink placeholder:text-muted/60 focus:border-primary"
  } outline-none transition-colors`;
  const fileInputClass = `w-full font-sans text-sm ${
    isDark ? "text-white/70" : "text-ink/70"
  } file:mr-3 file:rounded file:border file:px-3 file:py-1.5 file:text-xs file:outline-none ${
    isDark
      ? "file:border-white/20 file:bg-obsidian file:text-white"
      : "file:border-muted/30 file:bg-white file:text-ink"
  }`;

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded border p-6 ${
        isDark ? "border-white/10 bg-obsidianCard" : "border-muted/20 bg-white"
      } ${className}`.trim()}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass} htmlFor={`${segment}-firstname`}>
            Prénom
          </label>
          <input
            id={`${segment}-firstname`}
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${segment}-email`}>
            Email
          </label>
          <input
            id={`${segment}-email`}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${segment}-phone`}>
            Téléphone
          </label>
          <input
            id={`${segment}-phone`}
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {(showCv || typeFormationOptions) && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {showCv && (
            <div>
              <label className={labelClass} htmlFor={`${segment}-cv`}>
                CV (PDF, facultatif)
              </label>
              <input
                id={`${segment}-cv`}
                type="file"
                accept="application/pdf"
                onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                className={fileInputClass}
              />
            </div>
          )}
          {typeFormationOptions && (
            <div>
              <label className={labelClass} htmlFor={`${segment}-type-formation`}>
                Type de formation
              </label>
              <select
                id={`${segment}-type-formation`}
                required
                value={typeFormation}
                onChange={(e) => setTypeFormation(e.target.value)}
                className={inputClass}
              >
                {typeFormationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {status === "error" && (
        <p className={`mt-3 text-sm ${isDark ? "text-accent" : "text-primary"}`}>
          {errorMessage ?? "Une erreur est survenue. Merci de réessayer plus tard."}
        </p>
      )}

      <p className={`mt-4 text-xs ${isDark ? "text-white/50" : "text-muted"}`}>
        Le résultat de ce test ne vous sera pas communiqué immédiatement.
      </p>

      <div className="mt-4">
        <Button
          type="submit"
          variant={isDark ? "dark" : "primary"}
          disabled={status === "sending"}
        >
          {status === "sending" ? "Envoi..." : ctaLabel}
        </Button>
      </div>
    </form>
  );
}
