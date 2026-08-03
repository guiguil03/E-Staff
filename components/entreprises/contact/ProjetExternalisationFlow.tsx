"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Button from "@/components/ui/Button";
import CalendarEmbed from "@/components/ui/CalendarEmbed";
import { apiPost, ApiError } from "@/lib/api";
import { SERVICE_TYPES } from "@/lib/types";
import {
  fieldsetClass,
  inputClass,
  labelClass,
  legendClass,
  selectClass,
  textareaClass,
} from "./formStyles";

type Step = "form" | "sending" | "calendar" | "final";

const initialState = {
  companyName: "",
  taxId: "",
  sector: "",
  address: "",
  country: "",
  contactName: "",
  contactRole: "",
  email: "",
  phone: "",
  serviceType: SERVICE_TYPES[0] as string,
  teamSize: "",
  startDate: "",
  needsDetails: "",
  consent: false,
};

export default function ProjetExternalisationFlow() {
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
      await apiPost("/entreprises-projets", values);
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
    return (
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <p className="font-display text-lg text-white">
          Vos informations ont bien été enregistrées.
        </p>
        <p className="mt-2 font-sans text-sm text-white/70">
          Réservez dès maintenant votre créneau de cadrage commercial (30
          min).
        </p>
        <CalendarEmbed
          className="mt-6"
          link={
            process.env.NEXT_PUBLIC_CAL_LINK_COMMERCIAL ??
            "e-staf/cadrage-commercial"
          }
          title="Réserver un créneau de cadrage commercial"
        />
        <div className="mt-6 text-center">
          <Button variant="dark" onClick={() => setStep("final")}>
            J&apos;ai réservé mon créneau
          </Button>
        </div>
      </div>
    );
  }

  if (step === "final") {
    return (
      <div className="rounded border border-accent/40 bg-obsidianCard p-6 text-center">
        <p className="font-display text-lg text-white">
          Merci, votre créneau est confirmé.
        </p>
        <p className="mt-3 font-sans text-sm text-white/70">
          Dès la finalisation de notre accord, un Espace Client e-Staf
          personnalisé sera mis à votre disposition. Vous pourrez y suivre la
          production en direct grâce à vos graphiques de performance et
          reportings hebdomadaires, piloter votre équipe dédiée (fiches
          talents, écoute des appels et livrables), accéder à votre
          historique de facturation et échanger directement avec votre
          Manager de compte.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>1. Informations sur l&apos;entreprise</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
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
            <label className={labelClass} htmlFor="taxId">
              Identifiant fiscal (SIRET / NIF / STAT)
            </label>
            <input
              id="taxId"
              required
              className={inputClass}
              value={values.taxId}
              onChange={(e) => update("taxId", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="sector">
              Secteur d&apos;activité / Domaine des clients
            </label>
            <input
              id="sector"
              required
              placeholder="E-commerce, SaaS, Formation..."
              className={inputClass}
              value={values.sector}
              onChange={(e) => update("sector", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="country">
              Pays
            </label>
            <input
              id="country"
              required
              className={inputClass}
              value={values.country}
              onChange={(e) => update("country", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="address">
              Adresse du siège social
            </label>
            <input
              id="address"
              required
              className={inputClass}
              value={values.address}
              onChange={(e) => update("address", e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>2. Contact & décisionnaire</legend>
        <div className="grid gap-4 sm:grid-cols-2">
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
            <label className={labelClass} htmlFor="contactRole">
              Poste / Fonction
            </label>
            <input
              id="contactRole"
              required
              placeholder="CEO, Head of Sales, COO..."
              className={inputClass}
              value={values.contactRole}
              onChange={(e) => update("contactRole", e.target.value)}
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
        </div>
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>3. Cahier des charges & attentes</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="serviceType">
              Type de prestation
            </label>
            <select
              id="serviceType"
              className={selectClass}
              value={values.serviceType}
              onChange={(e) => update("serviceType", e.target.value)}
            >
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="teamSize">
              Taille de l&apos;équipe / volume de profils recherchés
            </label>
            <input
              id="teamSize"
              required
              className={inputClass}
              value={values.teamSize}
              onChange={(e) => update("teamSize", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="startDate">
              Date de démarrage souhaitée
            </label>
            <input
              id="startDate"
              type="date"
              required
              className={inputClass}
              value={values.startDate}
              onChange={(e) => update("startDate", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="needsDetails">
              Besoins précis et attentes (CRM utilisé, spécificités métier,
              processus actuels)
            </label>
            <textarea
              id="needsDetails"
              required
              className={textareaClass}
              value={values.needsDetails}
              onChange={(e) => update("needsDetails", e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      <label className="flex items-start gap-3 text-sm text-white/80">
        <input
          type="checkbox"
          required
          className="mt-1 h-4 w-4 accent-accent"
          checked={values.consent}
          onChange={(e) => update("consent", e.target.checked)}
        />
        <span>
          J&apos;autorise e-Staf à traiter mes données dans le cadre de cette
          demande, conformément à sa{" "}
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
