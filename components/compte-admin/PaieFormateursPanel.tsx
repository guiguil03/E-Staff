"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet } from "@/lib/api";
import DetailPaieFormateursModal from "./DetailPaieFormateursModal";
import { adminHeaders } from "./adminHeaders";

interface LigneBucket {
  bucket: string;
  nbFormateurs: number;
  netAPayerTotal: number;
  payes: number;
  enAttente: number;
}

function fmtMontant(n: number): string {
  return `${n.toLocaleString("fr-FR")} Ar`;
}

// Paie des formateurs de l'Académie — miroir de DetailPaieAgentsModal /
// BudgetDecaissementPanel côté Production, mais ventilée par type de cours
// (TEF Canada, DELF DALF, DFP, FOL, Formation externe — voir
// BUCKETS_PAIE_FORMATEURS côté RhService) plutôt que par poste de charge du
// CA. Chaque ligne ouvre le même niveau de détail micro (formateur par
// formateur, groupes encadrés + heures effectuées, retenue/prime, moyen de
// paiement) via "Détails".
export default function PaieFormateursPanel() {
  const [lignes, setLignes] = useState<LigneBucket[] | "loading" | "erreur">("loading");
  const [detailBucket, setDetailBucket] = useState<string | null>(null);

  function refresh() {
    apiGet<LigneBucket[]>("/rh/paie-formateurs", adminHeaders())
      .then(setLignes)
      .catch(() => setLignes("erreur"));
  }

  useEffect(refresh, []);

  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <h3 className="font-display text-base font-semibold text-white">Paie Formateurs</h3>
        <p className="mt-1 font-mono text-[11px] text-white/40">
          Ventilée par type de cours — cliquez &quot;Détails&quot; pour la vue formateur par formateur.
        </p>

        {lignes === "loading" && <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>}
        {lignes === "erreur" && (
          <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>
        )}

        {Array.isArray(lignes) && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-widest text-white/40">
                  <th className="py-2 pr-3">Type de cours</th>
                  <th className="py-2 pr-3">Formateurs</th>
                  <th className="py-2 pr-3">Net à payer</th>
                  <th className="py-2 pr-3">Statut</th>
                  <th className="py-2 pr-3">Détails</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l) => (
                  <tr key={l.bucket} className="border-b border-white/5 font-sans text-sm text-white/80">
                    <td className="py-2.5 pr-3 text-white">{l.bucket}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs">{l.nbFormateurs}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs">{fmtMontant(l.netAPayerTotal)}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs">
                      {l.nbFormateurs === 0 ? (
                        "—"
                      ) : (
                        <span className={l.enAttente > 0 ? "text-accent" : "text-success"}>
                          {l.payes}/{l.nbFormateurs} payés
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3">
                      {l.nbFormateurs > 0 ? (
                        <button
                          onClick={() => setDetailBucket(l.bucket)}
                          className="font-mono text-[11px] uppercase tracking-widest text-accent hover:underline"
                        >
                          Détails
                        </button>
                      ) : (
                        <span className="font-mono text-[11px] text-white/30">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailBucket && (
        <DetailPaieFormateursModal bucket={detailBucket} onClose={() => setDetailBucket(null)} />
      )}
    </Reveal>
  );
}
