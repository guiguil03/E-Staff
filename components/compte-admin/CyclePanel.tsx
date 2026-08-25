"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { apiGet } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface CycleRow {
  attemptId: string;
  candidat: { firstName: string; lastName: string; email: string; phone: string };
  coordonneesRecuesLe: string;
  testStatut: string;
  testSoumisLe: string | null;
  totalScore: number | null;
  tier: string | null;
  contratEnvoyeLe: string | null;
  paiementConfirmeLe: string | null;
  paiementReference: string | null;
  apprenant: {
    matricule: string;
    groupeLabel: string;
    typeCours: string | null;
    formateurNom: string | null;
  } | null;
  production: {
    clientNom: string;
    role: string;
    depuisLe: string;
    superviseurNom: string | null;
  } | null;
}

const STATUS_LABELS: Record<string, string> = {
  en_cours: "Test en cours",
  soumis: "Test soumis",
  en_correction: "En correction",
  corrige: "Corrigé — à valider",
  rejete: "Non retenu",
  valide_pret_envoi: "Contrat prêt",
  contrat_envoye: "Contrat envoyé",
  en_attente_paiement: "Paiement en attente",
  active: "Actif",
};

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
}

// Vue "cycle complet" — une ligne par candidat, du dépôt de sa candidature
// jusqu'à son statut actuel dans le pipeline (test -> contrat -> paiement ->
// affectation formation -> production). Assemble EvaluationAttempt,
// Apprenant, Groupe, Formateur et (depuis le module Production, phase 4,
// 2026-08-26) la mission active de l'apprenant le cas échéant — voir
// RhService.getCycleComplet. La colonne Production affiche "—" pour un
// apprenant sans mission active (encore en formation), jamais un statut
// inventé.
export default function CyclePanel() {
  const [rows, setRows] = useState<CycleRow[] | "loading" | "erreur">("loading");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    apiGet<CycleRow[]>("/rh/cycle-complet", adminHeaders())
      .then(setRows)
      .catch(() => setRows("erreur"));
  }, []);

  const filtered = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r.candidat.firstName,
        r.candidat.lastName,
        r.candidat.email,
        r.apprenant?.matricule,
        r.apprenant?.groupeLabel,
        r.apprenant?.formateurNom,
        STATUS_LABELS[r.testStatut] ?? r.testStatut,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, filter]);

  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-semibold text-white">
              Cycle complet — recrutement → formation → production
            </h3>
            <p className="mt-1 font-sans text-xs text-white/50">
              Chaque candidat, de sa candidature à son statut actuel dans le pipeline.
            </p>
          </div>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrer..."
            className="w-full max-w-xs rounded border border-white/20 bg-obsidian px-3 py-1.5 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
          />
        </div>

        {rows === "loading" && (
          <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>
        )}
        {rows === "erreur" && (
          <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>
        )}

        {Array.isArray(rows) && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 font-mono text-[11px] uppercase tracking-widest text-white/40">
                  <th className="py-2 pr-4">Candidat</th>
                  <th className="py-2 pr-4">Reçu le</th>
                  <th className="py-2 pr-4">Test</th>
                  <th className="py-2 pr-4">Contrat</th>
                  <th className="py-2 pr-4">Paiement</th>
                  <th className="py-2 pr-4">Formation</th>
                  <th className="py-2 pr-4">Production</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.attemptId}
                    className="border-b border-white/5 align-top font-sans text-sm text-white/80 hover:bg-white/5"
                  >
                    <td className="py-2.5 pr-4">
                      <Link
                        href={`/compte/admin/cycle/${r.attemptId}`}
                        className="block text-white hover:text-accent hover:underline"
                      >
                        {r.candidat.firstName} {r.candidat.lastName}
                      </Link>
                      <span className="block font-mono text-[11px] text-white/40">
                        {r.candidat.email}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-white/50">
                      {fmtDate(r.coordonneesRecuesLe)}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="block">{STATUS_LABELS[r.testStatut] ?? r.testStatut}</span>
                      {r.totalScore !== null && (
                        <span className="block font-mono text-[11px] text-accent">
                          {r.totalScore}/100 {r.tier ? `— ${r.tier}` : ""}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-white/50">
                      {r.contratEnvoyeLe ? `Envoyé le ${fmtDate(r.contratEnvoyeLe)}` : "—"}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-white/50">
                      {r.paiementConfirmeLe
                        ? `Confirmé le ${fmtDate(r.paiementConfirmeLe)}`
                        : r.paiementReference
                          ? `Réf. reçue : ${r.paiementReference}`
                          : "—"}
                    </td>
                    <td className="py-2.5 pr-4">
                      {r.apprenant ? (
                        <>
                          <span className="block font-mono text-xs text-accent">
                            {r.apprenant.matricule}
                          </span>
                          <span className="block text-xs text-white/60">
                            {r.apprenant.groupeLabel}
                            {r.apprenant.typeCours ? ` · ${r.apprenant.typeCours}` : ""}
                          </span>
                          <span className="block text-[11px] text-white/40">
                            {r.apprenant.formateurNom ?? "Formateur non assigné"}
                          </span>
                        </>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4">
                      {r.production ? (
                        <>
                          <span className="block text-xs text-white">{r.production.clientNom}</span>
                          <span className="block text-[11px] text-white/60">{r.production.role}</span>
                          <span className="block text-[11px] text-white/40">
                            depuis le {fmtDate(r.production.depuisLe)}
                            {r.production.superviseurNom && ` · ${r.production.superviseurNom}`}
                          </span>
                        </>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center font-sans text-sm text-white/40">
                      Aucun résultat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Reveal>
  );
}
