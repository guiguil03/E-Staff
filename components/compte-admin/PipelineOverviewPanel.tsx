"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

interface PipelineAttempt {
  id: string;
  status: string;
  tier: string | null;
  totalScore: number | null;
  candidat: { firstName: string; lastName: string; email: string };
  apprenant: { matricule: string } | null;
}

const STATUS_LABELS: Record<string, string> = {
  corrige: "Corrigé — à valider",
  valide_pret_envoi: "Validé — envoi ce soir (20h)",
  contrat_envoye: "Contrat envoyé — en attente de paiement",
  en_attente_paiement: "Référence reçue — à confirmer",
  active: "Activé",
  rejete: "Non retenu",
};

const STATUS_TONE: Record<string, string> = {
  corrige: "text-white/60",
  valide_pret_envoi: "text-accent",
  contrat_envoye: "text-accent",
  en_attente_paiement: "text-accent",
  active: "text-success",
  rejete: "text-white/30",
};

function adminHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-admin-matricule": matricule } : {};
}

// Vue d'ensemble du pipeline post-test — complète Validation RH et
// Paiements (qui ne montrent que ce qui est actionnable maintenant) avec
// tout le reste : ce qui attend l'envoi de 20h, ce qui a déjà été envoyé,
// et les comptes déjà activés avec leur matricule.
export default function PipelineOverviewPanel() {
  const [attempts, setAttempts] = useState<PipelineAttempt[] | "loading" | "erreur">("loading");

  useEffect(() => {
    apiGet<PipelineAttempt[]>("/evaluation/pipeline-overview", adminHeaders())
      .then(setAttempts)
      .catch(() => setAttempts("erreur"));
  }, []);

  return (
    <Reveal delay={80}>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <h3 className="font-display text-base font-semibold text-white">
          Vue d&apos;ensemble — pipeline candidats
        </h3>
        <p className="mt-1 font-sans text-xs text-white/50">
          Tous les candidats corrigés, du plus récent au plus ancien.
        </p>

        {attempts === "loading" && (
          <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>
        )}
        {attempts === "erreur" && (
          <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>
        )}
        {Array.isArray(attempts) && attempts.length === 0 && (
          <p className="mt-4 font-sans text-sm text-white/50">Aucun candidat corrigé pour le moment.</p>
        )}

        {Array.isArray(attempts) && attempts.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] font-sans text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-white/40">
                  <th className="py-2 pr-2 font-mono font-normal">Candidat</th>
                  <th className="py-2 pr-2 font-mono font-normal">Niveau</th>
                  <th className="py-2 pr-2 font-mono font-normal">Statut</th>
                  <th className="py-2 font-mono font-normal">Matricule</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} className="border-b border-white/5">
                    <td className="py-2 pr-2 text-white">
                      {a.candidat.firstName} {a.candidat.lastName}
                      <span className="block font-mono text-[10px] text-white/40">
                        {a.candidat.email}
                      </span>
                    </td>
                    <td className="py-2 pr-2 font-mono text-xs text-white/60">
                      {a.tier ?? "—"} {a.totalScore !== null ? `(${a.totalScore}/100)` : ""}
                    </td>
                    <td className={`py-2 pr-2 font-mono text-xs ${STATUS_TONE[a.status] ?? "text-white/60"}`}>
                      {STATUS_LABELS[a.status] ?? a.status}
                    </td>
                    <td className="py-2 font-mono text-xs text-white/70">
                      {a.apprenant?.matricule ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Reveal>
  );
}
