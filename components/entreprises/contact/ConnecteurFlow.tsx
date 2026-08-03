"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Button from "@/components/ui/Button";
import CalendarEmbed from "@/components/ui/CalendarEmbed";
import { apiPost, ApiError } from "@/lib/api";
import {
  ACTIVITY_TYPES,
  BUDGET_RANGES,
  CLIENT_COUNT_RANGES,
  CV_VOLUME_RANGES,
  OPPORTUNITY_TIMINGS,
  PAYMENT_CHANNELS,
  PRESENTATION_MODES,
  SOUGHT_ROLES,
} from "@/lib/types";
import { inputClass, labelClass } from "./formStyles";

type Step =
  | "presentation"
  | "coordonnees"
  | "calendrier"
  | "questionnaire"
  | "sending"
  | "confirmation";

const VALUE_BLOCKS = [
  {
    title: "Générez des revenus mensuels récurrents",
    text: "Ne vous contentez plus d'une commission ponctuelle unique. Tant que le contrat d'externalisation de votre client reste actif, vous percevez vos revenus chaque mois, en toute sécurité.",
  },
  {
    title: "Valorisez votre réseau sans effort opérationnel",
    text: "Vous mettez en relation, e-Staf s'occupe de tout le reste : cadrage des besoins, recrutement des équipes, infrastructure, management sur le terrain et suivi qualité.",
  },
  {
    title: "Des équipes d'élite immédiatement opérationnelles",
    text: "Offrez une réelle valeur ajoutée à votre réseau avec des pôles d'agents formés aux métiers de la vente, du support client, de la prospection ou du back-office, garantis sans turnover.",
  },
  {
    title: "Un Espace Connecteur dédié & transparent",
    text: "Suivez en temps réel l'avancement de vos recommandations, l'activation des contrats et le versement de vos revenus récurrents depuis votre tableau de bord personnel.",
  },
  {
    title: "Des infrastructures prêtes à l'emploi pour vos clients",
    text: "Rassurez vos contacts : leurs équipes évoluent dans des locaux entièrement équipés et sécurisés, sous un encadrement managérial rigoureux garantissant une continuité de service totale, sans coupures ni turnover.",
  },
];

const initialCoordonnees = { firstName: "", lastName: "", email: "", phone: "" };

const initialQuestionnaire = {
  activityType: "",
  clientCount: "",
  soughtRoles: [] as string[],
  cvVolume: "",
  budgetPerAgent: "",
  presentationMode: "",
  paymentChannel: "",
  opportunityTiming: "",
};

function RadioGroup({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mt-2 space-y-2">
      {options.map((option) => (
        <label
          key={option}
          className="flex cursor-pointer items-center gap-2 text-sm text-white/80"
        >
          <input
            type="radio"
            name={name}
            required
            className="h-4 w-4 accent-accent"
            checked={value === option}
            onChange={() => onChange(option)}
          />
          {option}
        </label>
      ))}
    </div>
  );
}

function CheckboxGroup({
  options,
  values,
  onChange,
}: {
  options: readonly string[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="mt-2 space-y-2">
      {options.map((option) => (
        <label
          key={option}
          className="flex cursor-pointer items-center gap-2 text-sm text-white/80"
        >
          <input
            type="checkbox"
            className="h-4 w-4 accent-accent"
            checked={values.includes(option)}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? [...values, option]
                  : values.filter((v) => v !== option)
              )
            }
          />
          {option}
        </label>
      ))}
    </div>
  );
}

export default function ConnecteurFlow() {
  const [step, setStep] = useState<Step>("presentation");
  const [coordonnees, setCoordonnees] = useState(initialCoordonnees);
  const [questionnaire, setQuestionnaire] = useState(initialQuestionnaire);
  const [error, setError] = useState<string | null>(null);

  async function handleFinalSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setStep("sending");
    try {
      await apiPost("/connecteurs", { ...coordonnees, ...questionnaire });
      setStep("confirmation");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Une erreur est survenue. Merci de réessayer plus tard."
      );
      setStep("questionnaire");
    }
  }

  if (step === "presentation") {
    return (
      <div className="rounded border border-white/10 bg-obsidianCard p-6 sm:p-8">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Vous œuvrez dans le domaine du recrutement ?
        </p>
        <p className="mt-4 font-sans text-base text-white/80">
          Une opportunité à concrétiser, un réseau à valoriser ou simplement
          une idée d&apos;alliance&nbsp;: devenez Connecteur e-Staf et créez
          des synergies d&apos;affaires durables en connectant vos partenaires
          à nos unités d&apos;élite.
        </p>

        <h3 className="mt-8 font-display text-lg font-semibold text-white">
          Pourquoi devenir Connecteur e-Staf ?
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {VALUE_BLOCKS.map((block) => (
            <div
              key={block.title}
              className="rounded border border-white/10 bg-obsidian p-4"
            >
              <p className="font-display text-sm font-semibold text-accent">
                {block.title}
              </p>
              <p className="mt-2 font-sans text-sm text-white/70">
                {block.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button variant="dark" onClick={() => setStep("coordonnees")}>
            Activer mon Réseau
          </Button>
        </div>
      </div>
    );
  }

  if (step === "coordonnees") {
    return (
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Étape 1 / 3
        </p>
        <h3 className="mt-2 font-display text-lg font-semibold text-white">
          Vos coordonnées
        </h3>
        <form
          className="mt-4 grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            setStep("calendrier");
          }}
        >
          <div>
            <label className={labelClass} htmlFor="connecteur-firstName">
              Prénom
            </label>
            <input
              id="connecteur-firstName"
              required
              className={inputClass}
              value={coordonnees.firstName}
              onChange={(e) =>
                setCoordonnees((v) => ({ ...v, firstName: e.target.value }))
              }
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="connecteur-lastName">
              Nom
            </label>
            <input
              id="connecteur-lastName"
              required
              className={inputClass}
              value={coordonnees.lastName}
              onChange={(e) =>
                setCoordonnees((v) => ({ ...v, lastName: e.target.value }))
              }
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="connecteur-email">
              Email professionnel
            </label>
            <input
              id="connecteur-email"
              type="email"
              required
              className={inputClass}
              value={coordonnees.email}
              onChange={(e) =>
                setCoordonnees((v) => ({ ...v, email: e.target.value }))
              }
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="connecteur-phone">
              Téléphone / WhatsApp
            </label>
            <input
              id="connecteur-phone"
              type="tel"
              required
              className={inputClass}
              value={coordonnees.phone}
              onChange={(e) =>
                setCoordonnees((v) => ({ ...v, phone: e.target.value }))
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" variant="dark">
              Continuer
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (step === "calendrier") {
    return (
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Étape 2 / 3
        </p>
        <h3 className="mt-2 font-display text-lg font-semibold text-white">
          Réservez un créneau de cadrage
        </h3>
        <p className="mt-2 font-sans text-sm text-white/70">
          Choisissez un créneau d&apos;échange privé avec un membre de
          l&apos;équipe e-Staf.
        </p>
        <CalendarEmbed
          className="mt-6"
          link={
            process.env.NEXT_PUBLIC_CAL_LINK_CONNECTEUR ??
            "e-staf/cadrage-connecteur"
          }
          title="Réserver un créneau de cadrage Connecteur"
        />
        <div className="mt-6 text-center">
          <Button variant="dark" onClick={() => setStep("questionnaire")}>
            J&apos;ai réservé mon créneau
          </Button>
        </div>
      </div>
    );
  }

  if (step === "questionnaire" || step === "sending") {
    return (
      <form
        onSubmit={handleFinalSubmit}
        className="rounded border border-white/10 bg-obsidianCard p-6"
      >
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Étape 3 / 3
        </p>
        <h3 className="mt-2 font-display text-lg font-semibold text-white">
          Questionnaire de pré-qualification
        </h3>

        <div className="mt-6 space-y-6">
          <div>
            <p className="font-display text-sm font-semibold text-white">
              A. Profil & potentiel réseau
            </p>
            <div className="mt-3">
              <p className={labelClass}>Votre activité principale</p>
              <RadioGroup
                name="activityType"
                options={ACTIVITY_TYPES}
                value={questionnaire.activityType}
                onChange={(v) =>
                  setQuestionnaire((q) => ({ ...q, activityType: v }))
                }
              />
            </div>
            <div className="mt-4">
              <p className={labelClass}>
                Avec combien de clients B2B collaborez-vous habituellement ?
              </p>
              <RadioGroup
                name="clientCount"
                options={CLIENT_COUNT_RANGES}
                value={questionnaire.clientCount}
                onChange={(v) =>
                  setQuestionnaire((q) => ({ ...q, clientCount: v }))
                }
              />
            </div>
          </div>

          <div>
            <p className="font-display text-sm font-semibold text-white">
              B. Besoins & habitudes de marché
            </p>
            <div className="mt-3">
              <p className={labelClass}>
                Postes les plus recherchés par votre réseau
              </p>
              <CheckboxGroup
                options={SOUGHT_ROLES}
                values={questionnaire.soughtRoles}
                onChange={(v) =>
                  setQuestionnaire((q) => ({ ...q, soughtRoles: v }))
                }
              />
            </div>
            <div className="mt-4">
              <p className={labelClass}>CV reçus en moyenne par offre</p>
              <RadioGroup
                name="cvVolume"
                options={CV_VOLUME_RANGES}
                value={questionnaire.cvVolume}
                onChange={(v) =>
                  setQuestionnaire((q) => ({ ...q, cvVolume: v }))
                }
              />
            </div>
            <div className="mt-4">
              <p className={labelClass}>
                Budget mensuel moyen alloué par agent par vos clients
              </p>
              <RadioGroup
                name="budgetPerAgent"
                options={BUDGET_RANGES}
                value={questionnaire.budgetPerAgent}
                onChange={(v) =>
                  setQuestionnaire((q) => ({ ...q, budgetPerAgent: v }))
                }
              />
            </div>
          </div>

          <div>
            <p className="font-display text-sm font-semibold text-white">
              C. Modèle d&apos;approche & modalités
            </p>
            <div className="mt-3">
              <p className={labelClass}>
                Comment comptez-vous présenter e-Staf à vos clients ?
              </p>
              <RadioGroup
                name="presentationMode"
                options={PRESENTATION_MODES}
                value={questionnaire.presentationMode}
                onChange={(v) =>
                  setQuestionnaire((q) => ({ ...q, presentationMode: v }))
                }
              />
            </div>
            <div className="mt-4">
              <p className={labelClass}>Canal de paiement privilégié</p>
              <RadioGroup
                name="paymentChannel"
                options={PAYMENT_CHANNELS}
                value={questionnaire.paymentChannel}
                onChange={(v) =>
                  setQuestionnaire((q) => ({ ...q, paymentChannel: v }))
                }
              />
            </div>
            <div className="mt-4">
              <p className={labelClass}>
                Avez-vous une opportunité ou un client à recommander dès
                aujourd&apos;hui ?
              </p>
              <RadioGroup
                name="opportunityTiming"
                options={OPPORTUNITY_TIMINGS}
                value={questionnaire.opportunityTiming}
                onChange={(v) =>
                  setQuestionnaire((q) => ({ ...q, opportunityTiming: v }))
                }
              />
            </div>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-accent">{error}</p>}

        <div className="mt-6">
          <Button type="submit" variant="dark" disabled={step === "sending"}>
            {step === "sending"
              ? "Envoi..."
              : "Confirmer mon créneau et envoyer mes réponses"}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="rounded border border-accent/40 bg-obsidianCard p-6 text-center">
      <p className="font-display text-lg text-white">
        Merci {coordonnees.firstName}, votre demande a bien été envoyée.
      </p>
      <p className="mt-3 font-sans text-sm text-white/70">
        Un membre de l&apos;équipe e-Staf vous retrouve à votre créneau réservé
        pour cadrer ensemble votre entrée dans le réseau Connecteur.
      </p>
    </div>
  );
}
