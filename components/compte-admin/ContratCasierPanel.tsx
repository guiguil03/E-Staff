"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface MissionHistorique {
  agentNom: string;
  agentMatricule: string;
  role: string;
  dateDebut: string;
  dateFin: string | null;
  superviseurNom: string | null;
  qualityScore: number | null;
}

interface FactureHistorique {
  periode: string;
  montant: number;
  statut: string;
  dateEmission: string;
  datePaiement: string | null;
}

interface ContratCasier {
  clientNom: string;
  description: string | null;
  dateSignature: string | null;
  dateDebut: string;
  dateFin: string | null;
  statut: string;
  tarifMensuel: number | null;
  totalFacture: number;
  totalPaye: number;
  totalEnAttente: number;
  missions: MissionHistorique[];
  factures: FactureHistorique[];
}

const STATUT_LABELS: Record<string, string> = {
  actif: "Actif",
  termine: "Terminé",
  suspendu: "Suspendu",
};

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
}

function fmtMontant(n: number): string {
  return `${n.toLocaleString("fr-FR")} Ar`;
}

// Casier contrat B2B — historique complet des agents staffés dessus et de
// toutes ses factures (voir ProductionService.getContratCasier). Complète
// les 4 autres casiers (Apprenant/Formateur/Superviseur/Partenaire) pour que
// chaque entité du cycle recrutement -> formation -> production ait sa fiche
// détaillée avec historique réel.
export default function ContratCasierPanel({ id }: { id: string }) {
  const [casier, setCasier] = useState<ContratCasier | "loading" | "erreur">("loading");

  useEffect(() => {
    apiGet<ContratCasier>(`/production/contrats/${id}/casier`, adminHeaders())
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg font-semibold text-white">{casier.clientNom}</p>
              {casier.description && (
                <p className="mt-1 font-sans text-sm text-white/60">{casier.description}</p>
              )}
              <p className="mt-1 font-mono text-[11px] text-white/40">
                {fmtDate(casier.dateDebut)} → {fmtDate(casier.dateFin)}
                {casier.tarifMensuel && ` · ${fmtMontant(casier.tarifMensuel)}/mois`}
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-white/40">
                Signature : {fmtDate(casier.dateSignature)}
              </p>
            </div>
            <span className="rounded-full border border-accent/40 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-accent">
              {STATUT_LABELS[casier.statut] ?? casier.statut}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-3 text-sm">
            <p className="text-white/70">
              Facturé : <span className="text-white">{fmtMontant(casier.totalFacture)}</span>
            </p>
            <p className="text-white/70">
              Payé : <span className="text-success">{fmtMontant(casier.totalPaye)}</span>
            </p>
            <p className="text-white/70">
              En attente : <span className="text-accent">{fmtMontant(casier.totalEnAttente)}</span>
            </p>
          </div>
        </div>
      </Reveal>

      <Reveal delay={20}>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <h3 className="font-display text-base font-semibold text-white">
            Agents staffés (historique)
          </h3>
          <div className="mt-4 space-y-2">
            {casier.missions.length === 0 && (
              <p className="font-sans text-sm text-white/50">Aucun agent staffé pour l&apos;instant.</p>
            )}
            {casier.missions.map((m, i) => (
              <div key={i} className="rounded border border-white/10 bg-obsidian p-3">
                <p className="font-sans text-sm text-white">
                  {m.agentNom}
                  <span className="ml-2 font-mono text-[11px] text-white/40">{m.agentMatricule}</span>
                  {m.dateFin === null && (
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-success">
                      Active
                    </span>
                  )}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-white/50">
                  {m.role} · {m.superviseurNom ?? "Sans superviseur"}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-white/40">
                  {fmtDate(m.dateDebut)} → {fmtDate(m.dateFin)}
                  {m.qualityScore !== null && ` · QS ${m.qualityScore}/5`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={40}>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <h3 className="font-display text-base font-semibold text-white">Factures</h3>
          <div className="mt-4 space-y-2">
            {casier.factures.length === 0 && (
              <p className="font-sans text-sm text-white/50">Aucune facture pour l&apos;instant.</p>
            )}
            {casier.factures.map((f, i) => (
              <div
                key={i}
                className="flex flex-wrap items-center justify-between gap-3 rounded border border-white/10 bg-obsidian px-4 py-3"
              >
                <div>
                  <p className="font-sans text-sm text-white">{f.periode}</p>
                  <p className="font-mono text-[11px] text-white/40">
                    {fmtMontant(f.montant)} · émise le {fmtDate(f.dateEmission)}
                    {f.datePaiement && ` · payée le ${fmtDate(f.datePaiement)}`}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest ${
                    f.statut === "payee"
                      ? "border-success/40 text-success"
                      : "border-accent/40 text-accent"
                  }`}
                >
                  {f.statut === "payee" ? "Payée" : "Émise"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
