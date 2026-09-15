"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiGet, apiPostAuthed } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface AgentSuivi {
  id: string;
  nom: string;
  nbTestes: number;
  nbConvertis: number;
  commissionConversion: number;
  nbReinscriptions: number;
  commissionReinscription: number;
  filleuls: string[];
}

function fmtEur(n: number): string {
  return `${n.toLocaleString("fr-FR")} €`;
}

// Suivi des Agents d'Acquisition — synchronisation automatique demandée le
// 2026-09-15 : le candidat indique lui-même l'agent en passant le test (voir
// EvaluationFlow, liste déroulante alimentée par /evaluation/agents-acquisition),
// et la conversion/réinscription remontent ici sans ressaisie RH (voir
// RhService.getSuiviAgentsAcquisition). Distinct du suivi des Partenaires/
// Connecteurs (apporteurs B2B, commission récurrente de 5%) : ici commission
// fixe de 5€ par conversion et 5€ par réinscription.
export default function AgentsAcquisitionPanel() {
  const [suivi, setSuivi] = useState<AgentSuivi[] | "loading" | "erreur">("loading");
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  function refresh() {
    apiGet<AgentSuivi[]>("/rh/agents-acquisition", adminHeaders())
      .then(setSuivi)
      .catch(() => setSuivi("erreur"));
  }

  useEffect(refresh, []);

  async function createAgent() {
    if (!nom.trim()) return;
    setStatus("saving");
    try {
      await apiPostAuthed("/rh/agents-acquisition", { nom: nom.trim() }, adminHeaders());
      setNom("");
      setOpen(false);
      setStatus("idle");
      refresh();
    } catch {
      setStatus("error");
    }
  }

  const totalCommission =
    Array.isArray(suivi)
      ? suivi.reduce((sum, a) => sum + a.commissionConversion + a.commissionReinscription, 0)
      : 0;

  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-semibold text-white">
              Agents d&apos;Acquisition
            </h3>
            <p className="mt-1 font-mono text-[11px] text-white/40">
              Recommandation indiquée par le candidat au moment du test — 5€ par conversion, 5€
              par réinscription.
            </p>
          </div>
          <button
            onClick={() => setOpen((o) => !o)}
            className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
          >
            {open ? "Fermer" : "+ Ajouter un agent"}
          </button>
        </div>

        {open && (
          <div className="mt-4 flex items-end gap-3 rounded border border-white/10 bg-obsidian p-4">
            <div className="flex-1">
              <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                Nom de l&apos;agent
              </label>
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex. Hery R."
                className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
              />
            </div>
            <Button variant="dark" onClick={createAgent} disabled={status === "saving" || !nom.trim()}>
              {status === "saving" ? "Ajout..." : "Ajouter"}
            </Button>
          </div>
        )}
        {status === "error" && (
          <p className="mt-2 font-mono text-xs text-accent">Erreur — réessayer.</p>
        )}

        {suivi === "loading" && <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>}
        {suivi === "erreur" && (
          <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>
        )}
        {Array.isArray(suivi) && suivi.length === 0 && (
          <p className="mt-4 font-sans text-sm text-white/50">
            Aucun agent d&apos;acquisition enregistré pour l&apos;instant.
          </p>
        )}

        {Array.isArray(suivi) && suivi.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-widest text-white/40">
                  <th className="py-2 pr-3">Agent</th>
                  <th className="py-2 pr-3">Testés</th>
                  <th className="py-2 pr-3">Convertis</th>
                  <th className="py-2 pr-3">Commission conversion</th>
                  <th className="py-2 pr-3">Réinscriptions</th>
                  <th className="py-2 pr-3">Commission réinscription</th>
                  <th className="py-2 pr-3">Parrainages</th>
                </tr>
              </thead>
              <tbody>
                {suivi.map((a) => (
                  <tr key={a.id} className="border-b border-white/5 font-sans text-sm text-white/80">
                    <td className="py-2.5 pr-3 text-white">{a.nom}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs">{a.nbTestes}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs">{a.nbConvertis}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs text-accent">
                      {fmtEur(a.commissionConversion)}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-xs">{a.nbReinscriptions}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs text-accent">
                      {fmtEur(a.commissionReinscription)}
                    </td>
                    <td className="py-2.5 pr-3">
                      {a.filleuls.length === 0 ? (
                        <span className="font-mono text-xs text-white/40">—</span>
                      ) : (
                        <details>
                          <summary className="cursor-pointer font-mono text-xs text-accent">
                            {a.filleuls.length} parrainage{a.filleuls.length > 1 ? "s" : ""}
                          </summary>
                          <ul className="mt-1.5 space-y-0.5">
                            {a.filleuls.map((f, i) => (
                              <li key={i} className="font-sans text-xs text-white/70">
                                {f}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/10 font-sans text-sm font-semibold text-white">
                  <td className="py-2.5 pr-3" colSpan={6}>
                    Total des commissions
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-xs text-accent">
                    {fmtEur(totalCommission)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </Reveal>
  );
}
