"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { apiGet, apiPostAuthed, apiPut } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface ClientDetail {
  performanceId: string;
  contratId: string;
  clientNom: string;
  tauxPerformance: number | null;
  prime: number;
}

interface CoordonneesPaiement {
  type: string;
  numero: string;
  verifieLe: string | null;
}

interface DetailSuperviseur {
  superviseurId: string;
  matricule: string;
  prenom: string;
  nom: string;
  agentsActifs: number;
  clientsDetail: ClientDetail[];
  montantFixe: number;
  totalPrimes: number;
  netAPayer: number;
  coordonneesPaiement: CoordonneesPaiement | null;
  statut: string;
  datePaiement: string | null;
}

function fmtMontant(n: number): string {
  return `${n.toLocaleString("fr-FR")} Ar`;
}

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
}

// Vision "Double Équipe" derrière le poste "Pool Superviseurs" — un
// superviseur peut encadrer plusieurs clients en parallèle, chacun avec sa
// propre performance et sa propre prime (voir PerformanceSuperviseurClient),
// mais un seul Net à Payer par période (Fixe + somme des primes, voir
// PaiementSuperviseur / ProductionService.getDetailPoolSuperviseurs). Rendu
// via portail (même raison que ClientMissionModal).
export default function DetailPoolSuperviseursModal({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<DetailSuperviseur[] | "loading" | "erreur">("loading");

  function refresh() {
    apiGet<DetailSuperviseur[]>("/production/detail-pool-superviseurs", adminHeaders())
      .then((d) => setData(d))
      .catch(() => setData("erreur"));
  }

  useEffect(refresh, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded border border-white/10 bg-obsidianCard p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <p className="font-display text-lg font-semibold text-white">
              Détail — pool des superviseurs
            </p>
            <p className="mt-1 font-mono text-[11px] text-white/40">
              Traçabilité du poste &quot;Pool Superviseurs&quot; — un superviseur peut encadrer
              plusieurs clients (Double Équipe), chacun avec sa propre performance et sa propre
              prime.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded border border-white/15 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-white/50 hover:border-white/30 hover:text-white"
          >
            Fermer
          </button>
        </div>

        {data === "loading" && (
          <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>
        )}
        {data === "erreur" && (
          <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>
        )}

        {Array.isArray(data) && data.length === 0 && (
          <p className="mt-4 font-sans text-sm text-white/50">Aucun superviseur enregistré.</p>
        )}

        {Array.isArray(data) && data.length > 0 && (
          <div className="mt-4 space-y-3">
            {data.map((s) => (
              <SuperviseurCard key={s.superviseurId} sup={s} onSaved={refresh} />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function SuperviseurCard({ sup, onSaved }: { sup: DetailSuperviseur; onSaved: () => void }) {
  const [montantFixe, setMontantFixe] = useState(String(sup.montantFixe));
  const [savingFixe, setSavingFixe] = useState(false);
  const [paying, setPaying] = useState(false);
  const periode = new Date().toISOString().slice(0, 7);

  const paye = sup.statut === "paye";

  async function saveFixe() {
    setSavingFixe(true);
    try {
      await apiPut(
        `/production/paiements-superviseur/${sup.superviseurId}/${periode}`,
        { montantFixe: Number(montantFixe) || 0 },
        adminHeaders()
      );
      onSaved();
    } finally {
      setSavingFixe(false);
    }
  }

  async function payer() {
    if (
      !window.confirm(
        `Confirmer le paiement de ${fmtMontant(sup.netAPayer)} à ${sup.prenom} ${sup.nom} ? Cette action est irréversible.`
      )
    )
      return;
    setPaying(true);
    try {
      await apiPostAuthed(
        `/production/paiements-superviseur/${sup.superviseurId}/${periode}/payer`,
        {},
        adminHeaders()
      );
      onSaved();
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="rounded border border-white/10 bg-obsidian p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-sans text-sm text-white">
            {sup.prenom} {sup.nom}
            <span className="ml-2 font-mono text-[11px] text-white/40">{sup.matricule}</span>
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-white/50">
            {sup.agentsActifs} agent{sup.agentsActifs > 1 ? "s" : ""} actif
            {sup.agentsActifs > 1 ? "s" : ""}
            {sup.clientsDetail.length > 0 &&
              ` · ${sup.clientsDetail.map((c) => c.clientNom).join(", ")}`}
          </p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest ${
            paye ? "border-success/40 text-success" : "border-accent/40 text-accent"
          }`}
        >
          {paye ? `Payé le ${fmtDate(sup.datePaiement)}` : "En attente"}
        </span>
      </div>

      {sup.clientsDetail.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-widest text-white/40">
                <th className="py-1.5 pr-3">Client</th>
                <th className="py-1.5 pr-3">Performance</th>
                <th className="py-1.5 pr-3">Prime</th>
              </tr>
            </thead>
            <tbody>
              {sup.clientsDetail.map((c) => (
                <ClientPerfRow key={c.performanceId} client={c} onSaved={onSaved} disabled={paye} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-white/10 pt-3">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-white/40">
              Fixe
            </label>
            <input
              type="number"
              value={montantFixe}
              onChange={(e) => setMontantFixe(e.target.value)}
              onBlur={saveFixe}
              disabled={savingFixe || paye}
              className="mt-1 w-28 rounded border border-white/20 bg-obsidianCard px-2 py-1 font-mono text-xs text-white outline-none focus:border-accent disabled:opacity-60"
            />
          </div>
          <p className="font-mono text-xs text-white/50">
            + {fmtMontant(sup.totalPrimes)} de primes ={" "}
            <span className="font-semibold text-white">Net à payer {fmtMontant(sup.netAPayer)}</span>
          </p>
        </div>
        <div className="text-right">
          {sup.coordonneesPaiement ? (
            <p className="font-mono text-[11px] text-white/50">
              {sup.coordonneesPaiement.type} — {sup.coordonneesPaiement.numero}
            </p>
          ) : (
            <p className="font-mono text-[11px] text-accent">Coordonnées non vérifiées</p>
          )}
          {!paye && (
            <button
              onClick={payer}
              disabled={paying}
              className="mt-1 rounded border border-accent px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-accent hover:bg-accent/10 disabled:opacity-50"
            >
              {paying ? "..." : "Valider & Payer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ClientPerfRow({
  client,
  onSaved,
  disabled,
}: {
  client: ClientDetail;
  onSaved: () => void;
  disabled: boolean;
}) {
  const [tauxPerformance, setTauxPerformance] = useState(
    client.tauxPerformance !== null ? String(client.tauxPerformance) : ""
  );
  const [prime, setPrime] = useState(String(client.prime));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await apiPut(
        `/production/performances-superviseur-client/${client.performanceId}`,
        {
          tauxPerformance: tauxPerformance === "" ? null : Number(tauxPerformance),
          prime: Number(prime) || 0,
        },
        adminHeaders()
      );
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-b border-white/5 font-sans text-xs text-white/80">
      <td className="py-1.5 pr-3">{client.clientNom}</td>
      <td className="py-1.5 pr-3">
        <input
          type="number"
          value={tauxPerformance}
          onChange={(e) => setTauxPerformance(e.target.value)}
          onBlur={save}
          disabled={saving || disabled}
          className="w-16 rounded border border-white/20 bg-obsidianCard px-2 py-1 font-mono text-xs text-white outline-none focus:border-accent disabled:opacity-60"
        />
        <span className="ml-1 text-white/40">%</span>
      </td>
      <td className="py-1.5 pr-3">
        <input
          type="number"
          value={prime}
          onChange={(e) => setPrime(e.target.value)}
          onBlur={save}
          disabled={saving || disabled}
          className="w-24 rounded border border-white/20 bg-obsidianCard px-2 py-1 font-mono text-xs text-white outline-none focus:border-accent disabled:opacity-60"
        />
      </td>
    </tr>
  );
}
