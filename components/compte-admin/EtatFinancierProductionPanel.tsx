"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import MonthlyTrendChart from "./MonthlyTrendChart";
import { adminHeaders } from "./adminHeaders";

interface EtatClient {
  clientNom: string;
  nbAgents: number;
  caEncaisse: number;
  coutEstime: number;
  beneficeNetEstaf: number;
}

interface TendanceMois {
  periode: string;
  caEncaisse: number;
  depenseReelle: number;
}

function fmtMontant(n: number): string {
  return `${n.toLocaleString("fr-FR")} Ar`;
}

// Facture.periode est un champ libre saisi par la RH ("2026-09" en usage
// normal, mais rien ne l'impose côté schéma) — retombe sur la valeur brute
// si elle ne suit pas le format "AAAA-MM" plutôt que d'afficher "Invalid
// Date".
function fmtPeriode(p: string): string {
  const match = /^(\d{4})-(\d{1,2})$/.exec(p);
  if (!match) return p;
  const [, y, m] = match;
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("fr-FR", { month: "short" });
}

// État financier global — Production. CA réellement encaissé (factures
// payées) par client, ventilé 80/20 (voir MARGIN_PCT_ESTAF côté backend),
// plus la tendance mensuelle réelle. Voir
// ProductionService.getEtatFinancierProductionParClient /
// getTendanceMensuelleProduction — jamais de mois ou de client fabriqué :
// seuls les contrats actifs et les mois avec facture/décaissement réels
// apparaissent.
export default function EtatFinancierProductionPanel() {
  const [clients, setClients] = useState<EtatClient[] | "loading" | "erreur">("loading");
  const [tendance, setTendance] = useState<TendanceMois[] | "loading" | "erreur">("loading");

  useEffect(() => {
    apiGet<EtatClient[]>("/production/etat-financier-par-client", adminHeaders())
      .then(setClients)
      .catch(() => setClients("erreur"));
    apiGet<TendanceMois[]>("/production/tendance-mensuelle", adminHeaders())
      .then(setTendance)
      .catch(() => setTendance("erreur"));
  }, []);

  const totaux =
    Array.isArray(clients) && clients.length > 0
      ? clients.reduce(
          (acc, c) => ({
            nbAgents: acc.nbAgents + c.nbAgents,
            caEncaisse: acc.caEncaisse + c.caEncaisse,
            coutEstime: acc.coutEstime + c.coutEstime,
            beneficeNetEstaf: acc.beneficeNetEstaf + c.beneficeNetEstaf,
          }),
          { nbAgents: 0, caEncaisse: 0, coutEstime: 0, beneficeNetEstaf: 0 }
        )
      : null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <h3 className="font-display text-base font-semibold text-white">
          État financier global : Production
        </h3>
        <p className="mt-1 font-mono text-[11px] text-white/40">
          CA réellement encaissé (factures payées) par client actif.
        </p>

        {clients === "loading" && (
          <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>
        )}
        {clients === "erreur" && (
          <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>
        )}
        {Array.isArray(clients) && clients.length === 0 && (
          <p className="mt-4 font-sans text-sm text-white/50">Aucun contrat actif.</p>
        )}

        {Array.isArray(clients) && clients.length > 0 && totaux && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-widest text-white/40">
                  <th className="py-2 pr-3">Client</th>
                  <th className="py-2 pr-3">Agents</th>
                  <th className="py-2 pr-3">CA encaissé</th>
                  <th className="py-2 pr-3">Coût estimé (80%)</th>
                  <th className="py-2 pr-3">Bénéfice net e-Staf (20%)</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr
                    key={c.clientNom}
                    className="border-b border-white/5 font-sans text-xs text-white/80"
                  >
                    <td className="py-2 pr-3 text-white">{c.clientNom}</td>
                    <td className="py-2 pr-3 font-mono">{c.nbAgents}</td>
                    <td className="py-2 pr-3 font-mono">{fmtMontant(c.caEncaisse)}</td>
                    <td className="py-2 pr-3 font-mono">{fmtMontant(c.coutEstime)}</td>
                    <td className="py-2 pr-3 font-mono text-accent">
                      {fmtMontant(c.beneficeNetEstaf)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/10 font-sans text-xs font-semibold text-white">
                  <td className="py-2 pr-3">Total</td>
                  <td className="py-2 pr-3 font-mono">{totaux.nbAgents}</td>
                  <td className="py-2 pr-3 font-mono">{fmtMontant(totaux.caEncaisse)}</td>
                  <td className="py-2 pr-3 font-mono">{fmtMontant(totaux.coutEstime)}</td>
                  <td className="py-2 pr-3 font-mono text-accent">
                    {fmtMontant(totaux.beneficeNetEstaf)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <h3 className="font-display text-base font-semibold text-white">
          Tendance mensuelle : CA vs. dépenses réelles
        </h3>
        {tendance === "loading" && (
          <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>
        )}
        {tendance === "erreur" && (
          <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>
        )}
        {Array.isArray(tendance) && tendance.length === 0 && (
          <p className="mt-4 font-sans text-xs text-white/50">
            Pas encore de facture payée ou de décaissement enregistré.
          </p>
        )}
        {Array.isArray(tendance) && tendance.length > 0 && (
          <MonthlyTrendChart
            data={tendance.map((t) => ({
              label: fmtPeriode(t.periode),
              serieA: t.caEncaisse,
              serieB: t.depenseReelle,
            }))}
            labelA="CA encaissé"
            labelB="Dépenses réelles"
          />
        )}
      </div>
    </div>
  );
}
