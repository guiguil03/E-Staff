"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet, apiPostAuthed } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface ApprenantApporte {
  matricule: string;
  prenom: string;
  nom: string;
  statutAgent: string;
}

interface ContratApporte {
  id: string;
  clientNom: string;
  statut: string;
  tarifMensuel: number | null;
  dateDebut: string;
}

interface CommissionDemarrage {
  id: string;
  contratId: string;
  clientNom: string;
  connecteurNom: string | null;
  montant: number;
  statut: string;
  datePaiement: string | null;
}

interface CommissionRecurrenteCourante {
  masseSalariale: number;
  commission: number;
}

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
  apports: {
    apprenants: ApprenantApporte[];
    contrats: ContratApporte[];
    commissionsDemarrage: CommissionDemarrage[];
    commissionRecurrenteCourante: CommissionRecurrenteCourante | null;
    commissionRecurrenteCumulee: { montantPaye: number; montantEnAttente: number };
  };
}

const STATUT_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  actif: "Actif",
};

const STATUT_AGENT_LABELS: Record<string, string> = {
  formation: "En formation",
  essai: "En essai",
  actif: "Actif en mission",
  inactif: "Inactif",
};

function fmtMontant(n: number): string {
  return `${n.toLocaleString("fr-FR")} Ar`;
}

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
// questionnaire de pré-qualification déposé à la candidature, + les apports
// réels (apprenants, contrats B2B) et les commissions déjà modélisées côté
// Production (CommissionDemarrageApporteur, getCommissionsApporteurs).
export default function PartenaireCasierPanel({ id }: { id: string }) {
  const [casier, setCasier] = useState<PartenaireCasier | "loading" | "erreur">("loading");
  const [payingId, setPayingId] = useState<string | null>(null);

  function refresh() {
    apiGet<PartenaireCasier>(`/rh/partenaires/${id}/casier`, adminHeaders())
      .then(setCasier)
      .catch(() => setCasier("erreur"));
  }

  useEffect(refresh, [id]);

  async function payerDemarrage(commissionId: string, clientNom: string, montant: number) {
    if (
      !window.confirm(
        `Confirmer le paiement de la commission de démarrage (${fmtMontant(montant)}) pour ${clientNom} ? Cette action est irréversible.`
      )
    )
      return;
    setPayingId(commissionId);
    try {
      await apiPostAuthed(`/production/commissions-demarrage/${commissionId}/payer`, {}, adminHeaders());
      refresh();
    } finally {
      setPayingId(null);
    }
  }

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

      <Reveal delay={80}>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <h3 className="font-display text-base font-semibold text-white">Apports &amp; commissions</h3>
          <p className="mt-1 font-sans text-xs text-white/50">
            Ce que ce partenaire a réellement apporté — un apprenant encore en formation n&apos;a pas
            encore généré de commission.
          </p>

          <div className="mt-4 space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              Apprenants apportés
            </p>
            {casier.apports.apprenants.length === 0 && (
              <p className="font-sans text-sm text-white/50">Aucun apprenant apporté pour l&apos;instant.</p>
            )}
            {casier.apports.apprenants.map((a) => (
              <p key={a.matricule} className="font-mono text-[11px] text-white/60">
                {a.prenom} {a.nom} ({a.matricule}) — {STATUT_AGENT_LABELS[a.statutAgent] ?? a.statutAgent}
              </p>
            ))}
          </div>

          {casier.apports.contrats.length > 0 && (
            <div className="mt-4 space-y-1.5 border-t border-white/10 pt-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                Contrats B2B apportés — commission de démarrage (10%)
              </p>
              {casier.apports.contrats.map((c) => {
                const commission = casier.apports.commissionsDemarrage.find((d) => d.contratId === c.id);
                return (
                  <div key={c.id} className="flex items-center justify-between gap-2">
                    <p className="font-mono text-[11px] text-white/60">
                      {c.clientNom} {commission ? `— ${fmtMontant(commission.montant)}` : ""}
                    </p>
                    {commission &&
                      (commission.statut === "paye" ? (
                        <span className="rounded-full border border-success/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-success">
                          Payée
                        </span>
                      ) : (
                        <button
                          onClick={() => payerDemarrage(commission.id, c.clientNom, commission.montant)}
                          disabled={payingId === commission.id}
                          className="rounded border border-accent/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent hover:bg-accent/10 disabled:opacity-50"
                        >
                          {payingId === commission.id ? "..." : "Valider & Payer"}
                        </button>
                      ))}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 space-y-1 border-t border-white/10 pt-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              Commission récurrente (5% — agents actuellement en mission)
            </p>
            <p className="font-sans text-sm text-white">
              {casier.apports.commissionRecurrenteCourante
                ? `Ce mois-ci : ${fmtMontant(casier.apports.commissionRecurrenteCourante.commission)}`
                : "Aucun agent actuellement en mission ce mois-ci."}
            </p>
            <p className="font-mono text-[11px] text-white/50">
              Cumul historique — payé : {fmtMontant(casier.apports.commissionRecurrenteCumulee.montantPaye)} ·
              en attente : {fmtMontant(casier.apports.commissionRecurrenteCumulee.montantEnAttente)}
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
