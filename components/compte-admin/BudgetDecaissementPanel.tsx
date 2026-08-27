"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet, apiPostAuthed, apiPut } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface PosteBudget {
  poste: string;
  label: string;
  pctAlloc: number;
  montantTheorique: number;
  montantReel: number;
  ecart: number;
  statut: string;
  datePaiement: string | null;
}

interface TableauFinancierGlobal {
  periode: string;
  caTotal: number;
  budgetTheoriqueGlobal: number;
  depenseReelleValidee: number;
  economieNette: number;
  marginNetteTheorique: number;
  statutOperations: { payees: number; enAttente: number; total: number };
  postes: PosteBudget[];
}

interface DetailClient {
  clientNom: string;
  ca: number;
  postes: { poste: string; label: string; montant: number }[];
  totalCharges: number;
  margeNetteTheorique: number;
}

function fmtMontant(n: number): string {
  return `${n.toLocaleString("fr-FR")} Ar`;
}

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
}

function fmtPeriode(p: string): string {
  const [y, m] = p.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded border border-white/10 bg-obsidianCard p-5">
      <p className="font-mono text-[11px] uppercase tracking-widest text-white/50">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-accent">{value}</p>
      {sub && <p className="mt-0.5 font-mono text-[11px] text-white/40">{sub}</p>}
    </div>
  );
}

// Tableau de bord budgétaire de la production — ventilation du CA des
// contrats actifs (tarifMensuel) en 6 postes de charge représentant 90% du
// CA (voir ProductionService.getTableauFinancierGlobal), suivis mois par
// mois. Le montant théorique est calculé automatiquement ; le montant réel
// est saisi/corrigé par la RH (aucune synchronisation automatique des
// primes/coûts d'infra réels n'existe encore), sur le même principe que les
// Factures : une ligne "en attente" jusqu'à ce qu'elle soit marquée payée.
export default function BudgetDecaissementPanel() {
  const [tableau, setTableau] = useState<TableauFinancierGlobal | "loading" | "erreur">("loading");
  const [detailClients, setDetailClients] = useState<DetailClient[] | "loading" | "erreur">(
    "loading"
  );
  const [payingPoste, setPayingPoste] = useState<string | null>(null);
  const [payingTout, setPayingTout] = useState(false);

  function refresh() {
    apiGet<TableauFinancierGlobal>("/production/tableau-financier-global", adminHeaders())
      .then(setTableau)
      .catch(() => setTableau("erreur"));
    apiGet<DetailClient[]>("/production/detail-financier-par-client", adminHeaders())
      .then(setDetailClients)
      .catch(() => setDetailClients("erreur"));
  }

  useEffect(refresh, []);

  async function payer(poste: string, periode: string) {
    setPayingPoste(poste);
    try {
      await apiPostAuthed(`/production/decaissements/${poste}/${periode}/payer`, {}, adminHeaders());
      refresh();
    } finally {
      setPayingPoste(null);
    }
  }

  async function payerTout(periode: string) {
    setPayingTout(true);
    try {
      await apiPostAuthed(`/production/decaissements/payer-tout?periode=${periode}`, {}, adminHeaders());
      refresh();
    } finally {
      setPayingTout(false);
    }
  }

  return (
    <div className="space-y-6">
      {tableau === "loading" && <p className="font-sans text-sm text-white/50">Chargement...</p>}
      {tableau === "erreur" && (
        <p className="font-sans text-sm text-white/50">Erreur de chargement.</p>
      )}

      {typeof tableau === "object" && (
        <>
          <Reveal>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Budget théorique global"
                value={fmtMontant(tableau.budgetTheoriqueGlobal)}
                sub="90% du CA des contrats actifs"
              />
              <KpiCard
                label="Dépenses réelles validées"
                value={fmtMontant(tableau.depenseReelleValidee)}
                sub="Paiements & engagements"
              />
              <KpiCard
                label="Économie / reliquat net"
                value={`${tableau.economieNette >= 0 ? "+" : ""}${fmtMontant(tableau.economieNette)}`}
              />
              <KpiCard
                label="Statut des opérations"
                value={`${tableau.statutOperations.enAttente} en attente`}
                sub={`${tableau.statutOperations.payees}/${tableau.statutOperations.total} postes réglés`}
              />
            </div>
          </Reveal>

          <Reveal delay={20}>
            <div className="rounded border border-white/10 bg-obsidianCard p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-semibold text-white">
                    Vue globale du budget & états des paiements
                  </h3>
                  <p className="mt-1 font-mono text-[11px] text-white/40">
                    Période : {fmtPeriode(tableau.periode)} · CA total : {fmtMontant(tableau.caTotal)}
                  </p>
                </div>
                <button
                  onClick={() => payerTout(tableau.periode)}
                  disabled={payingTout || tableau.statutOperations.enAttente === 0}
                  className="rounded border border-success/40 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-success hover:bg-success/10 disabled:opacity-50"
                >
                  {payingTout ? "..." : "Tout payer"}
                </button>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-widest text-white/40">
                      <th className="py-2 pr-3">Postes & ventilation</th>
                      <th className="py-2 pr-3">% alloc.</th>
                      <th className="py-2 pr-3">Budget théorique</th>
                      <th className="py-2 pr-3">Dépense réelle</th>
                      <th className="py-2 pr-3">Écart</th>
                      <th className="py-2 pr-3">Statut</th>
                      <th className="py-2 pr-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableau.postes.map((p) => (
                      <PosteRow
                        key={p.poste}
                        poste={p}
                        periode={tableau.periode}
                        paying={payingPoste === p.poste}
                        onPayer={() => payer(p.poste, tableau.periode)}
                        onSaved={refresh}
                      />
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/10 font-sans text-sm font-semibold text-white">
                      <td className="py-2.5 pr-3">Total des charges</td>
                      <td className="py-2.5 pr-3 font-mono text-xs">90 %</td>
                      <td className="py-2.5 pr-3 font-mono text-xs">
                        {fmtMontant(tableau.budgetTheoriqueGlobal)}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-xs">
                        {fmtMontant(tableau.depenseReelleValidee)}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-xs text-success">
                        {tableau.economieNette >= 0 ? "+" : ""}
                        {fmtMontant(tableau.economieNette)}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-xs">
                        {tableau.statutOperations.payees}/{tableau.statutOperations.total} validés
                      </td>
                      <td className="py-2.5 pr-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <p className="mt-3 font-mono text-[11px] text-white/40">
                Marge nette théorique E-Staf (10% restant du CA) : {fmtMontant(tableau.marginNetteTheorique)}
              </p>
            </div>
          </Reveal>
        </>
      )}

      <Reveal delay={40}>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <h3 className="font-display text-base font-semibold text-white">Détail par client</h3>
          <p className="mt-1 font-mono text-[11px] text-white/40">
            Même ventilation appliquée au tarif mensuel de chaque contrat actif — informatif, pas
            suivi paiement par paiement (voir tableau global ci-dessus).
          </p>

          {detailClients === "loading" && (
            <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>
          )}
          {detailClients === "erreur" && (
            <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>
          )}
          {Array.isArray(detailClients) && detailClients.length === 0 && (
            <p className="mt-4 font-sans text-sm text-white/50">Aucun contrat actif.</p>
          )}
          {Array.isArray(detailClients) && detailClients.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-widest text-white/40">
                    <th className="py-2 pr-3">Client</th>
                    <th className="py-2 pr-3">CA</th>
                    {detailClients[0].postes.map((p) => (
                      <th key={p.poste} className="py-2 pr-3">
                        {p.label}
                      </th>
                    ))}
                    <th className="py-2 pr-3">Total charges</th>
                    <th className="py-2 pr-3">Marge nette</th>
                  </tr>
                </thead>
                <tbody>
                  {detailClients.map((c) => (
                    <tr
                      key={c.clientNom}
                      className="border-b border-white/5 font-sans text-xs text-white/80"
                    >
                      <td className="py-2 pr-3 text-white">{c.clientNom}</td>
                      <td className="py-2 pr-3 font-mono">{fmtMontant(c.ca)}</td>
                      {c.postes.map((p) => (
                        <td key={p.poste} className="py-2 pr-3 font-mono">
                          {fmtMontant(p.montant)}
                        </td>
                      ))}
                      <td className="py-2 pr-3 font-mono">{fmtMontant(c.totalCharges)}</td>
                      <td className="py-2 pr-3 font-mono text-accent">
                        {fmtMontant(c.margeNetteTheorique)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}

function PosteRow({
  poste,
  periode,
  paying,
  onPayer,
  onSaved,
}: {
  poste: PosteBudget;
  periode: string;
  paying: boolean;
  onPayer: () => void;
  onSaved: () => void;
}) {
  const [montantReel, setMontantReel] = useState(String(poste.montantReel));
  const [savingReel, setSavingReel] = useState(false);

  async function saveReel() {
    const value = Number(montantReel);
    if (Number.isNaN(value) || value === poste.montantReel) return;
    setSavingReel(true);
    try {
      await apiPut(
        `/production/decaissements/${poste.poste}/${periode}/montant-reel`,
        { montantReel: value },
        adminHeaders()
      );
      onSaved();
    } finally {
      setSavingReel(false);
    }
  }

  return (
    <tr className="border-b border-white/5 font-sans text-sm text-white/80">
      <td className="py-2.5 pr-3 text-white">{poste.label}</td>
      <td className="py-2.5 pr-3 font-mono text-xs">{Math.round(poste.pctAlloc * 1000) / 10} %</td>
      <td className="py-2.5 pr-3 font-mono text-xs">{fmtMontant(poste.montantTheorique)}</td>
      <td className="py-2.5 pr-3">
        <input
          type="number"
          value={montantReel}
          onChange={(e) => setMontantReel(e.target.value)}
          onBlur={saveReel}
          disabled={savingReel || poste.statut === "paye"}
          className="w-28 rounded border border-white/20 bg-obsidian px-2 py-1 font-mono text-xs text-white outline-none focus:border-accent disabled:opacity-60"
        />
      </td>
      <td
        className={`py-2.5 pr-3 font-mono text-xs ${poste.ecart >= 0 ? "text-success" : "text-accent"}`}
      >
        {poste.ecart >= 0 ? "+" : ""}
        {fmtMontant(poste.ecart)}
      </td>
      <td className="py-2.5 pr-3">
        <span
          className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${
            poste.statut === "paye"
              ? "border-success/40 text-success"
              : "border-accent/40 text-accent"
          }`}
        >
          {poste.statut === "paye" ? `Payé le ${fmtDate(poste.datePaiement)}` : "En attente"}
        </span>
      </td>
      <td className="py-2.5 pr-3">
        {poste.statut !== "paye" && (
          <button
            onClick={onPayer}
            disabled={paying}
            className="rounded border border-accent px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-accent hover:bg-accent/10 disabled:opacity-50"
          >
            {paying ? "..." : `Payer (${fmtMontant(poste.montantReel)})`}
          </button>
        )}
      </td>
    </tr>
  );
}
