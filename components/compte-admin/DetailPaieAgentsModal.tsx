"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { apiGet, apiPostAuthed, apiPut } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface LignePaieAgent {
  missionId: string;
  agentNom: string;
  agentMatricule: string;
  clientNom: string;
  superviseurNom: string | null;
  tarifNegocie: number | null;
  qualityScore: number | null;
  tauxAtteinteObjectifs: number | null;
  montantBase: number;
  montantPrime: number;
  moyenPaiement: string | null;
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
// contrat, payé à combien, avec quelle prime (calculée depuis le
// qualityScore de sa mission, en l'absence d'objectif chiffré individuel) et
// par quel moyen. Voir ProductionService.getDetailPaieAgents. Rendu via
// portail (même raison que ClientMissionModal : un ancestor Reveal casse
// position:fixed).
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
        className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded border border-white/10 bg-obsidianCard p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <p className="font-display text-lg font-semibold text-white">
              Détail — paie & primes des agents
            </p>
            <p className="mt-1 font-mono text-[11px] text-white/40">
              Traçabilité des postes &quot;Salaires Fixes Agents&quot; et &quot;Primes Performance
              Agents&quot;.
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
              <table className="w-full min-w-[980px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-widest text-white/40">
                    <th className="py-2 pr-3">Agent</th>
                    <th className="py-2 pr-3">Client</th>
                    <th className="py-2 pr-3">Tarif négocié</th>
                    <th className="py-2 pr-3">Taux d&apos;atteinte</th>
                    <th className="py-2 pr-3">Montant payé</th>
                    <th className="py-2 pr-3">Prime</th>
                    <th className="py-2 pr-3">Moyen de paiement</th>
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
  const [moyenPaiement, setMoyenPaiement] = useState(ligne.moyenPaiement ?? "");
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await apiPut(
        `/production/paiements-agents/${ligne.missionId}/${periode}`,
        {
          montantBase: Number(montantBase) || 0,
          montantPrime: Number(montantPrime) || 0,
          moyenPaiement: moyenPaiement.trim() || null,
        },
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
        {ligne.tauxAtteinteObjectifs !== null ? (
          <>
            {ligne.tauxAtteinteObjectifs}%
            <span className="block text-[10px] text-white/40">
              (score qualité {ligne.qualityScore}/5)
            </span>
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
      </td>
      <td className="py-2 pr-3">
        <input
          value={moyenPaiement}
          onChange={(e) => setMoyenPaiement(e.target.value)}
          onBlur={save}
          disabled={saving || paye}
          placeholder="Mobile Money, virement..."
          className="w-36 rounded border border-white/20 bg-obsidian px-2 py-1 text-xs text-white placeholder:text-white/30 outline-none focus:border-accent disabled:opacity-60"
        />
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
