"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPut } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface EtatTypeCours {
  typeCours: string;
  nbApprenantsActifs: number;
  prixFormation: number;
  caTheorique: number;
  coutPrevu: number;
  beneficeNetEstaf: number;
}

function fmtMontant(n: number): string {
  return `${n.toLocaleString("fr-FR")} Ar`;
}

// État financier global — Académie. Miroir d'EtatFinancierProductionPanel
// mais ventilé par type de cours (Groupe.typeCours) plutôt que par client,
// et avec une répartition inverse (coût prévu 20% / bénéfice net e-Staf 80%
// — la Formation n'a pas la masse salariale d'agents de la Production, voir
// RhService.getEtatFinancierFormation). Le CA théorique dépend d'un prix
// catalogue par type de cours saisi ici même par la RH (TarifFormation, 0
// par défaut) : jamais un chiffre d'affaires inventé.
export default function EtatFinancierFormationPanel() {
  const [lignes, setLignes] = useState<EtatTypeCours[] | "loading" | "erreur">("loading");

  function refresh() {
    apiGet<EtatTypeCours[]>("/rh/etat-financier-formation", adminHeaders())
      .then(setLignes)
      .catch(() => setLignes("erreur"));
  }

  useEffect(refresh, []);

  const totaux =
    Array.isArray(lignes) && lignes.length > 0
      ? lignes.reduce(
          (acc, l) => ({
            nbApprenantsActifs: acc.nbApprenantsActifs + l.nbApprenantsActifs,
            caTheorique: acc.caTheorique + l.caTheorique,
            coutPrevu: acc.coutPrevu + l.coutPrevu,
            beneficeNetEstaf: acc.beneficeNetEstaf + l.beneficeNetEstaf,
          }),
          { nbApprenantsActifs: 0, caTheorique: 0, coutPrevu: 0, beneficeNetEstaf: 0 }
        )
      : null;

  return (
    <div className="rounded border border-white/10 bg-obsidianCard p-6">
      <h3 className="font-display text-base font-semibold text-white">
        État financier global : Académie
      </h3>
      <p className="mt-1 font-mono text-[11px] text-white/40">
        CA théorique par type de cours (apprenants actifs × prix catalogue) — coût prévu 20% /
        bénéfice net e-Staf 80%.
      </p>

      {lignes === "loading" && <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>}
      {lignes === "erreur" && (
        <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>
      )}
      {Array.isArray(lignes) && lignes.length === 0 && (
        <p className="mt-4 font-sans text-sm text-white/50">
          Aucun type de cours renseigné sur les vagues actuelles.
        </p>
      )}

      {Array.isArray(lignes) && lignes.length > 0 && totaux && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-widest text-white/40">
                <th className="py-2 pr-3">Type de cours</th>
                <th className="py-2 pr-3">Apprenants actifs</th>
                <th className="py-2 pr-3">Prix catalogue</th>
                <th className="py-2 pr-3">CA théorique</th>
                <th className="py-2 pr-3">Coût prévu (20%)</th>
                <th className="py-2 pr-3">Bénéfice net e-Staf (80%)</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => (
                <LigneTypeCours key={l.typeCours} ligne={l} onSaved={refresh} />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/10 font-sans text-xs font-semibold text-white">
                <td className="py-2 pr-3">Total</td>
                <td className="py-2 pr-3 font-mono">{totaux.nbApprenantsActifs}</td>
                <td className="py-2 pr-3"></td>
                <td className="py-2 pr-3 font-mono">{fmtMontant(totaux.caTheorique)}</td>
                <td className="py-2 pr-3 font-mono">{fmtMontant(totaux.coutPrevu)}</td>
                <td className="py-2 pr-3 font-mono text-accent">
                  {fmtMontant(totaux.beneficeNetEstaf)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function LigneTypeCours({ ligne, onSaved }: { ligne: EtatTypeCours; onSaved: () => void }) {
  const [prix, setPrix] = useState(String(ligne.prixFormation));
  const [saving, setSaving] = useState(false);

  async function savePrix() {
    const value = Number(prix);
    if (Number.isNaN(value) || value < 0 || value === ligne.prixFormation) return;
    setSaving(true);
    try {
      await apiPut(
        `/rh/tarif-formation/${encodeURIComponent(ligne.typeCours)}`,
        { prixFormation: value },
        adminHeaders()
      );
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-b border-white/5 font-sans text-xs text-white/80">
      <td className="py-2 pr-3 text-white">{ligne.typeCours}</td>
      <td className="py-2 pr-3 font-mono">{ligne.nbApprenantsActifs}</td>
      <td className="py-2 pr-3">
        <input
          type="number"
          value={prix}
          onChange={(e) => setPrix(e.target.value)}
          onBlur={savePrix}
          disabled={saving}
          className="w-28 rounded border border-white/20 bg-obsidian px-2 py-1 font-mono text-xs text-white outline-none focus:border-accent disabled:opacity-60"
        />
      </td>
      <td className="py-2 pr-3 font-mono">{fmtMontant(ligne.caTheorique)}</td>
      <td className="py-2 pr-3 font-mono">{fmtMontant(ligne.coutPrevu)}</td>
      <td className="py-2 pr-3 font-mono text-accent">{fmtMontant(ligne.beneficeNetEstaf)}</td>
    </tr>
  );
}
