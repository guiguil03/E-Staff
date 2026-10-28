"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet } from "@/lib/api";
import { agentMatricule as matriculeSession, fmtDate, fmtHeures, fmtMontant, fmtPeriode } from "../compte-agent/agentApi";

interface MonCasier {
  matricule: string;
  prenom: string;
  nom: string;
  email: string;
  equipe: { agentNom: string; matricule: string; clientNom: string; role: string }[];
  remuneration: { fixe: number | null };
  paiements: {
    lignes: { periode: string; montantFixe: number; statut: string; datePaiement: string | null }[];
    parMois: { periode: string; percu: number; enAttente: number }[];
    totalPercu: number;
  };
  performances: { periode: string; clientNom: string; tauxPerformance: number | null; prime: number }[];
  absences: { id: string; jour: string; heures: number; justifiee: boolean; motif: string | null }[];
}

const CARD = "rounded border border-white/10 bg-obsidianCard p-5";
const LABEL = "font-mono text-[11px] uppercase tracking-widest text-white/40";

// Mon casier (superviseur) : ce que la société garde sur lui — son équipe,
// sa performance par client, ses absences et ses paiements mois par mois.
export default function MonCasierSuperviseur() {
  const [data, setData] = useState<MonCasier | "loading" | "erreur">("loading");

  useEffect(() => {
    const matricule = matriculeSession();
    if (!matricule) {
      setData("erreur");
      return;
    }
    apiGet<MonCasier>(`/superviseurs/${matricule}/mon-casier`)
      .then(setData)
      .catch(() => setData("erreur"));
  }, []);

  if (data === "loading") return <p className="font-sans text-sm text-white/50">Chargement...</p>;
  if (data === "erreur") {
    return <p className="font-sans text-sm text-white/50">Impossible de charger votre casier pour le moment.</p>;
  }

  return (
    <div className="space-y-4">
      <Reveal>
        <div className={CARD}>
          <h3 className="font-display text-lg font-semibold text-white">Mes informations</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className={LABEL}>Matricule</p>
              <p className="mt-1 font-sans text-sm text-white">{data.matricule}</p>
            </div>
            <div>
              <p className={LABEL}>Nom</p>
              <p className="mt-1 font-sans text-sm text-white">{data.prenom} {data.nom}</p>
            </div>
            <div>
              <p className={LABEL}>E-mail</p>
              <p className="mt-1 break-all font-sans text-sm text-white">{data.email}</p>
            </div>
            <div>
              <p className={LABEL}>Fixe enregistré (RH)</p>
              <p className="mt-1 font-sans text-sm text-white">{fmtMontant(data.remuneration.fixe)}</p>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className={CARD}>
          <h3 className="font-display text-lg font-semibold text-white">Mon équipe</h3>
          {data.equipe.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-white/50">Aucun agent supervisé pour l&apos;instant.</p>
          ) : (
            <ul className="mt-3 divide-y divide-white/5">
              {data.equipe.map((a) => (
                <li key={a.matricule} className="py-2 font-sans text-sm text-white">
                  {a.agentNom}
                  <span className="ml-2 font-mono text-[11px] text-white/40">{a.matricule}</span>
                  <span className="block font-mono text-[11px] text-white/50">{a.role} · {a.clientNom}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Reveal>

      <Reveal>
        <div className={CARD}>
          <h3 className="font-display text-lg font-semibold text-white">Ma performance par client</h3>
          {data.performances.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-white/50">Aucune performance renseignée par la RH.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[420px] text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    {["Mois", "Client", "Performance", "Prime"].map((h) => (
                      <th key={h} className={`${LABEL} py-2 pr-3`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.performances.map((p, i) => (
                    <tr key={`${p.periode}-${i}`} className="border-b border-white/5">
                      <td className="py-2 pr-3 font-mono text-xs text-white/70">{fmtPeriode(p.periode)}</td>
                      <td className="py-2 pr-3 font-sans text-sm text-white">{p.clientNom}</td>
                      <td className="py-2 pr-3 font-sans text-sm text-white">
                        {p.tauxPerformance === null ? "—" : `${p.tauxPerformance}%`}
                      </td>
                      <td className="py-2 font-sans text-sm text-accent">{fmtMontant(p.prime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Reveal>

      <Reveal>
        <div className={CARD}>
          <h3 className="font-display text-lg font-semibold text-white">Mes absences</h3>
          {data.absences.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-white/50">Aucune absence enregistrée.</p>
          ) : (
            <ul className="mt-3 divide-y divide-white/5">
              {data.absences.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <p className="font-sans text-sm text-white">
                    <span className="font-mono text-xs text-white/60">{fmtDate(a.jour)}</span> · {fmtHeures(a.heures)}
                    {a.motif && <span className="text-white/50"> — {a.motif}</span>}
                  </p>
                  <span className={`font-mono text-[11px] uppercase tracking-widest ${a.justifiee ? "text-statusGreen" : "text-statusRed"}`}>
                    {a.justifiee ? "Justifiée" : "Retenue sur paie"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Reveal>

      <Reveal>
        <div className={CARD}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-lg font-semibold text-white">Somme perçue par mois</h3>
            <p className="font-sans text-sm text-white/70">
              Total perçu : <span className="font-semibold text-accent">{fmtMontant(data.paiements.totalPercu)}</span>
            </p>
          </div>
          {data.paiements.parMois.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-white/50">Aucun paiement pour l&apos;instant.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[420px] text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    {["Mois", "Perçu", "En attente"].map((h) => (
                      <th key={h} className={`${LABEL} py-2 pr-3`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.paiements.parMois.map((m) => (
                    <tr key={m.periode} className="border-b border-white/5">
                      <td className="py-2 pr-3 font-mono text-xs text-white/70">{fmtPeriode(m.periode)}</td>
                      <td className="py-2 pr-3 font-sans text-sm font-semibold text-accent">{fmtMontant(m.percu)}</td>
                      <td className="py-2 font-sans text-sm text-white/60">{m.enAttente > 0 ? fmtMontant(m.enAttente) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Reveal>

      <Reveal>
        <div className={CARD}>
          <h3 className="font-display text-lg font-semibold text-white">Historique de mes paiements</h3>
          {data.paiements.lignes.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-white/50">Aucun paiement pour l&apos;instant.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[420px] text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    {["Période", "Montant", "Statut", "Payé le"].map((h) => (
                      <th key={h} className={`${LABEL} py-2 pr-3`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.paiements.lignes.map((l) => (
                    <tr key={l.periode} className="border-b border-white/5">
                      <td className="py-2 pr-3 font-mono text-xs text-white/70">{fmtPeriode(l.periode)}</td>
                      <td className="py-2 pr-3 font-sans text-sm text-accent">{fmtMontant(l.montantFixe)}</td>
                      <td className="py-2 pr-3 font-sans text-sm text-white/70">{l.statut === "paye" ? "Payé" : "En attente"}</td>
                      <td className="py-2 font-sans text-sm text-white/70">{fmtDate(l.datePaiement)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
