"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { apiGet, apiPostAuthed, apiPut } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface GroupeDetail {
  groupeLabel: string;
  typeCours: string | null;
  heuresEffectuees: number;
}

interface LignePaieFormateur {
  formateurId: string;
  matricule: string;
  formateurNom: string;
  groupes: GroupeDetail[];
  heuresTotal: number;
  montantBase: number;
  montantPrime: number;
  retenue: number;
  moyenPaiement: string | null;
  netAPayer: number;
  statut: string;
  datePaiement: string | null;
}

interface DetailPaieFormateurs {
  periode: string;
  bucket: string;
  lignes: LignePaieFormateur[];
}

function fmtMontant(n: number): string {
  return `${n.toLocaleString("fr-FR")} Ar`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
}

// Détail micro derrière une ligne "type de cours" du tableau Paie
// Formateurs — miroir de DetailPaieAgentsModal côté Production : nom du
// formateur, groupes encadrés avec heures réellement programmées (voir
// RhService.heuresGroupeSurPeriode), retenue/prime saisies par la RH, et
// moyen de paiement. Rendu via portail (même raison que DetailPaieAgentsModal
// : un ancestor Reveal casse position:fixed).
export default function DetailPaieFormateursModal({
  bucket,
  onClose,
}: {
  bucket: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<DetailPaieFormateurs | "loading" | "erreur">("loading");
  const [payingTout, setPayingTout] = useState(false);

  function refresh() {
    apiGet<DetailPaieFormateurs>(
      `/rh/paie-formateurs/${encodeURIComponent(bucket)}`,
      adminHeaders()
    )
      .then(setData)
      .catch(() => setData("erreur"));
  }

  useEffect(refresh, [bucket]);

  async function payerTous() {
    if (typeof data !== "object") return;
    const enAttente = data.lignes.filter((l) => l.statut !== "paye");
    const totalAPayer = round2(enAttente.reduce((sum, l) => sum + l.netAPayer, 0));
    if (
      !window.confirm(
        `Confirmer le paiement de ${enAttente.length} formateur(s) pour un total de ${fmtMontant(totalAPayer)} ? Cette action est irréversible.`
      )
    )
      return;
    setPayingTout(true);
    try {
      await apiPostAuthed(
        `/rh/paie-formateurs/${encodeURIComponent(bucket)}/payer-tout?periode=${data.periode}`,
        {},
        adminHeaders()
      );
      refresh();
    } finally {
      setPayingTout(false);
    }
  }

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
              Détail — paie des formateurs · {bucket}
            </p>
            <p className="mt-1 font-mono text-[11px] text-white/40">
              Heures effectuées = séances réellement programmées (Seance.startAt) sur le mois de
              paie.
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
              <p className="font-sans text-sm text-white/50">
                Aucun formateur rattaché à ce type de cours.
              </p>
            ) : (
              <>
                <div className="mb-3 flex justify-end">
                  <button
                    onClick={payerTous}
                    disabled={payingTout || data.lignes.every((l) => l.statut === "paye")}
                    className="rounded border border-success/40 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-success hover:bg-success/10 disabled:opacity-50"
                  >
                    {payingTout ? "..." : "Payer tous les formateurs en attente"}
                  </button>
                </div>
                <table className="w-full min-w-[1100px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-widest text-white/40">
                      <th className="py-2 pr-3">Formateur</th>
                      <th className="py-2 pr-3">Groupes & heures effectuées</th>
                      <th className="py-2 pr-3">Retenue</th>
                      <th className="py-2 pr-3">Prime</th>
                      <th className="py-2 pr-3">Base</th>
                      <th className="py-2 pr-3">Net à payer</th>
                      <th className="py-2 pr-3">Moyen de paiement</th>
                      <th className="py-2 pr-3">Statut</th>
                      <th className="py-2 pr-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lignes.map((l) => (
                      <LigneRow
                        key={l.formateurId}
                        ligne={l}
                        periode={data.periode}
                        onSaved={refresh}
                      />
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/10 font-sans text-sm font-semibold text-white">
                      <td className="py-2.5 pr-3">Total cumulé</td>
                      <td className="py-2.5 pr-3"></td>
                      <td className="py-2.5 pr-3 font-mono text-xs">
                        -{fmtMontant(round2(data.lignes.reduce((sum, l) => sum + l.retenue, 0)))}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-xs">
                        +{fmtMontant(round2(data.lignes.reduce((sum, l) => sum + l.montantPrime, 0)))}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-xs">
                        {fmtMontant(round2(data.lignes.reduce((sum, l) => sum + l.montantBase, 0)))}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-xs">
                        {fmtMontant(round2(data.lignes.reduce((sum, l) => sum + l.netAPayer, 0)))}
                      </td>
                      <td className="py-2.5 pr-3"></td>
                      <td className="py-2.5 pr-3 font-mono text-xs">
                        {data.lignes.filter((l) => l.statut === "paye").length} / {data.lignes.length}{" "}
                        payés
                      </td>
                      <td className="py-2.5 pr-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </>
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
  ligne: LignePaieFormateur;
  periode: string;
  onSaved: () => void;
}) {
  const [montantBase, setMontantBase] = useState(String(ligne.montantBase));
  const [montantPrime, setMontantPrime] = useState(String(ligne.montantPrime));
  const [retenue, setRetenue] = useState(String(ligne.retenue));
  const [moyenPaiement, setMoyenPaiement] = useState(ligne.moyenPaiement ?? "");
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await apiPut(
        `/rh/paie-formateurs/${ligne.formateurId}/${periode}`,
        {
          montantBase: Number(montantBase) || 0,
          montantPrime: Number(montantPrime) || 0,
          retenue: Number(retenue) || 0,
          moyenPaiement: moyenPaiement || null,
        },
        adminHeaders()
      );
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function payer() {
    if (
      !window.confirm(
        `Confirmer le paiement de ${fmtMontant(ligne.netAPayer)} à ${ligne.formateurNom} ? Cette action est irréversible.`
      )
    )
      return;
    setPaying(true);
    try {
      await apiPostAuthed(`/rh/paie-formateurs/${ligne.formateurId}/${periode}/payer`, {}, adminHeaders());
      onSaved();
    } finally {
      setPaying(false);
    }
  }

  const paye = ligne.statut === "paye";

  return (
    <tr className="border-b border-white/5 align-top font-sans text-xs text-white/80">
      <td className="py-2 pr-3">
        <span className="block text-white">{ligne.formateurNom}</span>
        <span className="block font-mono text-[10px] text-white/40">{ligne.matricule}</span>
      </td>
      <td className="py-2 pr-3">
        {ligne.groupes.length === 0 ? (
          "—"
        ) : (
          <ul className="space-y-0.5">
            {ligne.groupes.map((g) => (
              <li key={g.groupeLabel} className="text-white/70">
                {g.groupeLabel}
                <span className="ml-1 font-mono text-[10px] text-white/40">
                  ({g.heuresEffectuees}h)
                </span>
              </li>
            ))}
          </ul>
        )}
        <span className="mt-0.5 block font-mono text-[10px] text-white/40">
          Total : {ligne.heuresTotal}h
        </span>
      </td>
      <td className="py-2 pr-3">
        <input
          type="number"
          value={retenue}
          onChange={(e) => setRetenue(e.target.value)}
          onBlur={save}
          disabled={saving || paye}
          className="w-20 rounded border border-white/20 bg-obsidian px-2 py-1 font-mono text-xs text-white outline-none focus:border-accent disabled:opacity-60"
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
          type="number"
          value={montantBase}
          onChange={(e) => setMontantBase(e.target.value)}
          onBlur={save}
          disabled={saving || paye}
          className="w-24 rounded border border-white/20 bg-obsidian px-2 py-1 font-mono text-xs text-white outline-none focus:border-accent disabled:opacity-60"
        />
      </td>
      <td className="py-2 pr-3 font-mono font-semibold text-white">{fmtMontant(ligne.netAPayer)}</td>
      <td className="py-2 pr-3">
        <select
          value={moyenPaiement}
          onChange={(e) => setMoyenPaiement(e.target.value)}
          onBlur={save}
          disabled={saving || paye}
          className="w-32 rounded border border-white/20 bg-obsidian px-2 py-1 font-mono text-xs text-white outline-none focus:border-accent disabled:opacity-60"
        >
          <option value="">—</option>
          <option value="Mobile Money">Mobile Money</option>
          <option value="Virement bancaire">Virement bancaire</option>
          <option value="Espèces">Espèces</option>
        </select>
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
