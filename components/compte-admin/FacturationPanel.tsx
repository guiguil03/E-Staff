"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiGet, apiPostAuthed } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface TableauFinancier {
  revenuMensuelPotentiel: number;
  totalFacture: number;
  totalPaye: number;
  totalEnAttente: number;
  parContrat: {
    clientNom: string;
    tarifMensuel: number | null;
    totalFacture: number;
    totalPaye: number;
  }[];
}

interface Contrat {
  id: string;
  clientNom: string;
  statut: string;
}

interface Facture {
  id: string;
  periode: string;
  montant: number;
  statut: string;
  dateEmission: string;
  datePaiement: string | null;
  contrat: { clientNom: string };
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-obsidianCard p-5">
      <p className="font-mono text-[11px] uppercase tracking-widest text-white/50">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-accent">{value}</p>
    </div>
  );
}

function fmtMontant(n: number): string {
  return `${n.toLocaleString("fr-FR")} Ar`;
}

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
}

const emptyForm = { contratId: "", periode: "", montant: "" };

// Facturation & Encaissement — l'argent qui rentre (factures réelles
// rattachées aux ContratB2B, voir ProductionService.getTableauFinancier),
// séparé du budget/décaissements de production (l'argent qui sort, voir
// BudgetDecaissementPanel sur la page Paie & Commissions).
export default function FacturationPanel() {
  const [tableau, setTableau] = useState<TableauFinancier | "loading" | "erreur">("loading");
  const [factures, setFactures] = useState<Facture[] | "loading" | "erreur">("loading");
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  function refresh() {
    apiGet<TableauFinancier>("/production/tableau-financier", adminHeaders())
      .then(setTableau)
      .catch(() => setTableau("erreur"));
    apiGet<Facture[]>("/production/factures", adminHeaders())
      .then(setFactures)
      .catch(() => setFactures("erreur"));
    apiGet<Contrat[]>("/production/contrats", adminHeaders())
      .then((list) => setContrats(list.filter((c) => c.statut === "actif")))
      .catch(() => {});
  }

  useEffect(refresh, []);

  async function createFacture() {
    if (!form.contratId || !form.periode.trim() || !form.montant) return;
    setStatus("saving");
    setError(null);
    try {
      await apiPostAuthed(
        "/production/factures",
        { contratId: form.contratId, periode: form.periode.trim(), montant: Number(form.montant) },
        adminHeaders()
      );
      setForm(emptyForm);
      setOpen(false);
      setStatus("idle");
      refresh();
    } catch {
      setStatus("error");
      setError("Erreur — vérifiez les champs.");
    }
  }

  async function marquerPayee(id: string, clientNom: string, montant: number) {
    if (!window.confirm(`Marquer la facture de ${clientNom} (${fmtMontant(montant)}) comme payée ? Cette action est irréversible.`)) return;
    setPayingId(id);
    try {
      await apiPostAuthed(`/production/factures/${id}/payee`, {}, adminHeaders());
      refresh();
    } finally {
      setPayingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tableau === "loading" && <p className="font-sans text-sm text-white/50">Chargement...</p>}
          {tableau === "erreur" && (
            <p className="font-sans text-sm text-white/50">Erreur de chargement.</p>
          )}
          {typeof tableau === "object" && (
            <>
              <KpiCard label="Revenu mensuel potentiel" value={fmtMontant(tableau.revenuMensuelPotentiel)} />
              <KpiCard label="Total facturé" value={fmtMontant(tableau.totalFacture)} />
              <KpiCard label="Total payé" value={fmtMontant(tableau.totalPaye)} />
              <KpiCard label="En attente de paiement" value={fmtMontant(tableau.totalEnAttente)} />
            </>
          )}
        </div>
      </Reveal>

      {typeof tableau === "object" && tableau.parContrat.length > 0 && (
        <Reveal delay={20}>
          <div className="rounded border border-white/10 bg-obsidianCard p-6">
            <h3 className="font-display text-base font-semibold text-white">
              Facturation par contrat actif
            </h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10 font-mono text-[11px] uppercase tracking-widest text-white/40">
                    <th className="py-2 pr-4">Client</th>
                    <th className="py-2 pr-4">Tarif mensuel</th>
                    <th className="py-2 pr-4">Total facturé</th>
                    <th className="py-2 pr-4">Total payé</th>
                  </tr>
                </thead>
                <tbody>
                  {tableau.parContrat.map((c) => (
                    <tr key={c.clientNom} className="border-b border-white/5 font-sans text-sm text-white/80">
                      <td className="py-2.5 pr-4 text-white">{c.clientNom}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs">
                        {c.tarifMensuel ? fmtMontant(c.tarifMensuel) : "—"}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs">{fmtMontant(c.totalFacture)}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-success">
                        {fmtMontant(c.totalPaye)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      )}

      <Reveal delay={40}>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-white">Factures</h3>
            <button
              onClick={() => setOpen((o) => !o)}
              className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
            >
              {open ? "Fermer" : "+ Émettre une facture"}
            </button>
          </div>

          {open && (
            <div className="mt-4 rounded border border-white/10 bg-obsidian p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                    Contrat
                  </label>
                  <select
                    value={form.contratId}
                    onChange={(e) => setForm((f) => ({ ...f, contratId: e.target.value }))}
                    className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
                  >
                    <option value="">— Choisir —</option>
                    {contrats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.clientNom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                    Période
                  </label>
                  <input
                    type="month"
                    value={form.periode}
                    onChange={(e) => setForm((f) => ({ ...f, periode: e.target.value }))}
                    className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                    Montant
                  </label>
                  <input
                    type="number"
                    value={form.montant}
                    onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))}
                    placeholder="Ex. 3000000"
                    className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
                  />
                </div>
              </div>
              <div className="mt-3">
                <Button
                  variant="dark"
                  onClick={createFacture}
                  disabled={status === "saving" || !form.contratId || !form.periode.trim() || !form.montant}
                >
                  {status === "saving" ? "Émission..." : "Émettre la facture"}
                </Button>
              </div>
              {error && <p className="mt-2 font-mono text-xs text-accent">{error}</p>}
            </div>
          )}

          {factures === "loading" && (
            <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>
          )}
          {factures === "erreur" && (
            <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>
          )}
          {Array.isArray(factures) && factures.length === 0 && (
            <p className="mt-4 font-sans text-sm text-white/50">Aucune facture pour l&apos;instant.</p>
          )}
          {Array.isArray(factures) && factures.length > 0 && (
            <div className="mt-4 space-y-2">
              {factures.map((f) => (
                <div
                  key={f.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded border border-white/10 bg-obsidian px-4 py-3"
                >
                  <div>
                    <p className="font-sans text-sm text-white">
                      {f.contrat.clientNom} — {f.periode}
                    </p>
                    <p className="font-mono text-[11px] text-white/40">
                      {fmtMontant(f.montant)} · émise le {fmtDate(f.dateEmission)}
                      {f.datePaiement && ` · payée le ${fmtDate(f.datePaiement)}`}
                    </p>
                  </div>
                  {f.statut === "payee" ? (
                    <span className="rounded-full border border-success/40 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-success">
                      Payée
                    </span>
                  ) : (
                    <button
                      onClick={() => marquerPayee(f.id, f.contrat.clientNom, f.montant)}
                      disabled={payingId === f.id}
                      className="rounded border border-accent/40 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-accent hover:bg-accent/10 disabled:opacity-50"
                    >
                      {payingId === f.id ? "..." : "Marquer payée"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
