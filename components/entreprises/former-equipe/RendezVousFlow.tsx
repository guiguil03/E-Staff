"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import CalendarEmbed, { isCalendarConfigured } from "@/components/ui/CalendarEmbed";
import { apiPost, ApiError } from "@/lib/api";
import { SECTEURS_FORMATION } from "./secteurs";
import {
  fieldsetClass,
  inputClass,
  labelClass,
  legendClass,
  textareaClass,
} from "@/components/entreprises/contact/formStyles";

type Step = "form" | "sending" | "calendar" | "final";

const MOTIF_LABELS: Record<string, string> = {
  "rendez-vous": "Prise de rendez-vous",
  audit: "Audit gratuit (test sur 5 collaborateurs)",
  devis: "Demande de devis",
};

const initialState = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  effectif: "",
  message: "",
  consent: false,
};

// Flow dédié (formulaire court -> Cal.com -> confirmation) déclenché par
// tous les CTA de /entreprises/former-son-equipe : chaque secteur, l'Abonnement
// Vivier B2B et le Bootcamp Intensif y renvoient avec ?secteur=&motif= pour
// contextualiser le formulaire sans que l'entreprise ait à le repréciser.
// Même structure en 2 étapes que ProjetExternalisationFlow.tsx (form ->
// calendar -> final), page dédiée conformément à la convention du projet
// pour tout CTA qui ouvre un formulaire de taille significative.
export default function RendezVousFlow() {
  const searchParams = useSearchParams();
  const secteurSlug = searchParams.get("secteur") ?? "";
  const motif = searchParams.get("motif") ?? "rendez-vous";

  const secteur = SECTEURS_FORMATION.find((s) => s.slug === secteurSlug);
  const secteurLabel =
    secteur?.label ??
    (secteurSlug === "bootcamp"
      ? "Bootcamp Intensif : Français des Affaires"
      : secteurSlug === "vivier"
        ? "Abonnement Vivier B2B"
        : "Former son équipe");

  const [step, setStep] = useState<Step>("form");
  const [values, setValues] = useState(initialState);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof initialState>(
    key: K,
    value: (typeof initialState)[K]
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setStep("sending");
    try {
      await apiPost("/entreprises-formations", {
        ...values,
        secteur: secteurSlug,
        motif,
      });
      setStep("calendar");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Une erreur est survenue. Merci de réessayer plus tard."
      );
      setStep("form");
    }
  }

  if (step === "calendar") {
    const calLink = process.env.NEXT_PUBLIC_CAL_LINK_COMMERCIAL ?? "e-staf/cadrage-commercial";
    const calendarReady = isCalendarConfigured(calLink);

    return (
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <p className="font-display text-lg text-white">
          Vos informations ont bien été enregistrées.
        </p>
        <p className="mt-2 font-sans text-sm text-white/70">
          {calendarReady
            ? "Réservez dès maintenant votre créneau de cadrage."
            : "Un membre de l'équipe e-Staf vous recontactera très prochainement pour fixer votre créneau."}
        </p>
        <CalendarEmbed className="mt-6" link={calLink} title="Réserver un créneau de cadrage" />
        <div className="mt-6 text-center">
          <Button variant="dark" onClick={() => setStep("final")}>
            {calendarReady ? "J'ai réservé mon créneau" : "Continuer"}
          </Button>
        </div>
      </div>
    );
  }

  if (step === "final") {
    return (
      <div className="rounded border border-accent/40 bg-obsidianCard p-6 text-center">
        <p className="font-display text-lg text-white">Merci, votre demande est confirmée.</p>
        <p className="mt-3 font-sans text-sm text-white/70">
          Un membre de l&apos;équipe e-Staf revient vers vous rapidement pour la suite.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className={fieldsetClass}>
        <h2 className={legendClass}>
          {MOTIF_LABELS[motif] ?? "Prise de rendez-vous"} — {secteurLabel}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="companyName">
              Nom / Raison sociale de l&apos;entreprise
            </label>
            <input
              id="companyName"
              required
              className={inputClass}
              value={values.companyName}
              onChange={(e) => update("companyName", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="contactName">
              Nom & prénom du responsable
            </label>
            <input
              id="contactName"
              required
              className={inputClass}
              value={values.contactName}
              onChange={(e) => update("contactName", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="email">
              Adresse e-mail professionnelle
            </label>
            <input
              id="email"
              type="email"
              required
              className={inputClass}
              value={values.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="phone">
              Téléphone (avec indicatif)
            </label>
            <input
              id="phone"
              type="tel"
              required
              className={inputClass}
              value={values.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="effectif">
              Effectif à former / concerné
            </label>
            <input
              id="effectif"
              required
              placeholder="ex : 12 collaborateurs"
              className={inputClass}
              value={values.effectif}
              onChange={(e) => update("effectif", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="message">
              Précisions (facultatif)
            </label>
            <textarea
              id="message"
              className={textareaClass}
              value={values.message}
              onChange={(e) => update("message", e.target.value)}
            />
          </div>
        </div>
      </div>

      <label className="flex items-start gap-3 text-sm text-white/80">
        <input
          type="checkbox"
          required
          className="mt-1 h-4 w-4 accent-accent"
          checked={values.consent}
          onChange={(e) => update("consent", e.target.checked)}
        />
        <span>
          J&apos;autorise e-Staf à traiter mes données dans le cadre de cette demande,
          conformément à sa{" "}
          <a href="/confidentialite" className="text-accent underline">
            politique de confidentialité
          </a>
          .
        </span>
      </label>

      {error && <p className="text-sm text-accent">{error}</p>}

      <Button type="submit" variant="dark" disabled={step === "sending"}>
        {step === "sending" ? "Envoi..." : "Envoyer ma demande"}
      </Button>
    </form>
  );
}
