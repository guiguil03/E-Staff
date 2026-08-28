"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { apiGet, apiPostAuthed, apiPut } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface CoordonneesPaiement {
  type: string;
  numero: string;
  verifieLe: string | null;
}

interface LignePaieAgent {
  missionId: string;
  agentNom: string;
  agentMatricule: string;
  clientNom: string;
  superviseurNom: string | null;
  tarifNegocie: number | null;
  qualityScore: number | null;
  tauxAtteinteObjectifs: number | null;
  caRealiseMois: number;
  heuresAbsence: number;
  heuresRetard: number;
  heuresSup: number;
  retenueAbsence: number;
  primeHeuresSup: number;
  montantBase: number;
  montantPrime: number;
  netAPayer: number;
  coordonneesPaiement: CoordonneesPaiement | null;
  statut: string;
  datePaiement: string | null;
}

interface DetailPaieAgents {
  periode: string;
  lignes: LignePaieAgent[];
}

function fmtMontant(n: number): string {
  return `${n.toLocaleString("fr-FR")} Ar`;
}

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
}

// Vision micro derrière les postes "Salaires Fixes Agents" et "Primes
// Performance Agents" du tableau de bord financier — quel agent, sur quel
// contrat, avec quel Net à Payer (base + prime + heures sup − retenues
// d'absence, voir ProductionService.getDetailPaieAgents) et quelles
// coordonnées de paiement vérifiées (auto-pulled depuis le casier agent,
// jamais ressaisies manuellement ici). Rendu via portail (même raison que
// ClientMissionModal : un ancestor Reveal casse position:fixed).
export default function DetailPaieAgentsModal({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<DetailPaieAgents | "loading" | "erreur">("loading");

  function refresh() {
    apiGet<DetailPaieAgents>("/production/detail-paie-agents", adminHeaders())
      .then(setData)
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
        className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded border border-white/10 bg-obsidianCard p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <p className="font-display text-lg font-semibold text-white">
              Détail — paie & primes des agents
            </p>
            <p className="mt-1 font-mono text-[11px] text-white/40">
              Traçabilité des postes &quot;Salaires Fixes Agents&quot; et &quot;Primes Performance
              Agents&quot; — pointage et télévente saisis dans l&apos;onglet Performance des agents
              de chaque carte Mission/Client.
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

        {typeof data === "object" && (
          <div className="mt-4 overflow-x-auto">
            {data.lignes.length === 0 ? (
              <p className="font-sans text-sm text-white/50">Aucun agent en mission active.</p>
            ) : (
              <table className="w-full min-w-[1200px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-widest text-white/40">
                    <th className="py-2 pr-3">Agent</th>
                    <th className="py-2 pr-3">Client</th>
                    <th className="py-2 pr-3">Tarif négocié</th>
                    <th className="py-2 pr-3">Retenue absence</th>
                    <th className="py-2 pr-3">Prime h. sup</th>
                    <th className="py-2 pr-3">Base</th>
                    <th className="py-2 pr-3">Prime perf.</th>
                    <th className="py-2 pr-3">Net à payer</th>
                    <th className="py-2 pr-3">Coordonnées de paiement</th>
                    <th className="py-2 pr-3">Statut</th>
                    <th className="py-2 pr-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.lignes.map((l) => (
                    <LigneRow key={l.missionId} ligne={l} periode={data.periode} onSaved={refresh} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function LigneRow({
  ligne,
  periode,
  onSaved,
}: {
  ligne: LignePaieAgent;
  periode: string;
  onSaved: () => void;
}) {
  const [montantBase, setMontantBase] = useState(String(ligne.montantBase));
  const [montantPrime, setMontantPrime] = useState(String(ligne.montantPrime));
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await apiPut(
        `/production/paiements-agents/${ligne.missionId}/${periode}`,
        { montantBase: Number(montantBase) || 0, montantPrime: Number(montantPrime) || 0 },
        adminHeaders()
      );
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function payer() {
    setPaying(true);
    try {
      await apiPostAuthed(
        `/production/paiements-agents/${ligne.missionId}/${periode}/payer`,
        {},
        adminHeaders()
      );
      onSaved();
    } finally {
      setPaying(false);
    }
  }

  const paye = ligne.statut === "paye";

  return (
    <tr className="border-b border-white/5 align-top font-sans text-xs text-white/80">
      <td className="py-2 pr-3">
        <span className="block text-white">{ligne.agentNom}</span>
        <span className="block font-mono text-[10px] text-white/40">{ligne.agentMatricule}</span>
        {ligne.superviseurNom && (
          <span className="block font-mono text-[10px] text-white/40">
            Sup. {ligne.superviseurNom}
          </span>
        )}
      </td>
      <td className="py-2 pr-3">{ligne.clientNom}</td>
      <td className="py-2 pr-3 font-mono">
        {ligne.tarifNegocie !== null ? fmtMontant(ligne.tarifNegocie) : "—"}
      </td>
      <td className="py-2 pr-3 font-mono">
        {ligne.retenueAbsence > 0 ? (
          <>
            <span className="text-accent">-{fmtMontant(ligne.retenueAbsence)}</span>
            <span className="block text-[10px] text-white/40">{ligne.heuresAbsence}h</span>
          </>
        ) : (
          "—"
        )}
      </td>
      <td className="py-2 pr-3 font-mono">
        {ligne.primeHeuresSup > 0 ? (
          <>
            <span className="text-success">+{fmtMontant(ligne.primeHeuresSup)}</span>
            <span className="block text-[10px] text-white/40">{ligne.heuresSup}h</span>
          </>
        ) : (
          "—"
        )}
      </td>
      <td className="py-2 pr-3">
        <input
          type="number"
          value={montantBase}
          onChange={(e) => setMontantBase(e.target.value)}
          onBlur={save}
          disabled={saving || paye}
          className="w-24 rounded border border-white/20 bg-obsidian px-2 py-1 font-mono text-xs text-white outline-none focus:border-accent disabled:opacity-60"
        />
      </td>
      <td className="py-2 pr-3">
        <input
          type="number"
          value={montantPrime}
          onChange={(e) => setMontantPrime(e.target.value)}
          onBlur={save}
          disabled={saving || paye}
          className="w-24 rounded border border-white/20 bg-obsidian px-2 py-1 font-mono text-xs text-white outline-none focus:border-accent disabled:opacity-60"
        />
        {ligne.caRealiseMois > 0 && (
          <span className="mt-0.5 block font-mono text-[10px] text-white/40">
            CA réalisé : {fmtMontant(ligne.caRealiseMois)}
          </span>
        )}
      </td>
      <td className="py-2 pr-3 font-mono font-semibold text-white">{fmtMontant(ligne.netAPayer)}</td>
      <td className="py-2 pr-3">
        {ligne.coordonneesPaiement ? (
          <>
            <span className="block text-white">{ligne.coordonneesPaiement.type}</span>
            <span className="block font-mono text-[10px] text-white/40">
              {ligne.coordonneesPaiement.numero}
            </span>
            <span className="block font-mono text-[10px] text-success">
              Vérifié le {fmtDate(ligne.coordonneesPaiement.verifieLe)}
            </span>
          </>
        ) : (
          <Link
            href={`/compte/admin/apprenants/${ligne.agentMatricule}`}
            className="font-mono text-[10px] uppercase tracking-widest text-accent hover:underline"
          >
            Non vérifiées — compléter →
          </Link>
        )}
      </td>
      <td className="py-2 pr-3">
        <span
          className={`rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-widest ${
            paye ? "border-success/40 text-success" : "border-accent/40 text-accent"
          }`}
        >
          {paye ? `Payé le ${fmtDate(ligne.datePaiement)}` : "En attente"}
        </span>
      </td>
      <td className="py-2 pr-3">
        {!paye && (
          <button
            onClick={payer}
            disabled={paying}
            className="rounded border border-accent px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-accent hover:bg-accent/10 disabled:opacity-50"
          >
            {paying ? "..." : "Payer"}
          </button>
        )}
      </td>
    </tr>
  );
}
