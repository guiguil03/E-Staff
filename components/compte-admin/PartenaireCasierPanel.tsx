"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface PartenaireCasier {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  activityType: string;
  clientCount: string;
  soughtRoles: string[];
  cvVolume: string;
  budgetPerAgent: string;
  presentationMode: string;
  paymentChannel: string;
  opportunityTiming: string;
  status: string;
  candidatureRecueLe: string;
}

const STATUT_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  actif: "Actif",
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-widest text-white/40">{label}</p>
      <p className="mt-0.5 font-sans text-sm text-white">{value}</p>
    </div>
  );
}

// Casier partenaire côté RH — la candidature Connecteur complète (voir
// RhService.getPartenaireCasier) : pas de journal des changements de
// statut (aucune table d'historique), juste l'état actuel + le
// questionnaire de pré-qualification déposé à la candidature.
export default function PartenaireCasierPanel({ id }: { id: string }) {
  const [casier, setCasier] = useState<PartenaireCasier | "loading" | "erreur">("loading");

  useEffect(() => {
    apiGet<PartenaireCasier>(`/rh/partenaires/${id}/casier`, adminHeaders())
      .then(setCasier)
      .catch(() => setCasier("erreur"));
  }, [id]);

  if (casier === "loading") return <p className="font-sans text-sm text-white/50">Chargement...</p>;
  if (casier === "erreur")
    return <p className="font-sans text-sm text-white/50">Erreur de chargement.</p>;

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg font-semibold text-white">
                {casier.firstName} {casier.lastName}
              </p>
              <p className="font-mono text-xs text-white/40">
                {casier.email} · {casier.phone}
              </p>
            </div>
            <span className="rounded-full border border-accent/40 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-accent">
              {STATUT_LABELS[casier.status] ?? casier.status}
            </span>
          </div>
          <p className="mt-2 font-mono text-[11px] text-white/40">
            Candidature reçue le {new Date(casier.candidatureRecueLe).toLocaleDateString("fr-FR")}
          </p>
        </div>
      </Reveal>

      <Reveal delay={40}>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <h3 className="font-display text-base font-semibold text-white">
            Questionnaire de pré-qualification
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Type d'activité" value={casier.activityType} />
            <Field label="Nombre de clients" value={casier.clientCount} />
            <Field label="Rôles recherchés" value={casier.soughtRoles.join(", ")} />
            <Field label="Volume de CV" value={casier.cvVolume} />
            <Field label="Budget par agent" value={casier.budgetPerAgent} />
            <Field label="Mode de présentation" value={casier.presentationMode} />
            <Field label="Canal de paiement" value={casier.paymentChannel} />
            <Field label="Délai d'opportunité" value={casier.opportunityTiming} />
          </div>
        </div>
      </Reveal>
    </div>
  );
}
