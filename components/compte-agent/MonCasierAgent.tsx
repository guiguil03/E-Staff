"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet, apiGetBlob } from "@/lib/api";
import {
  agentMatricule,
  fmtDate,
  fmtMontant,
  fmtPeriode,
  STATUT_AGENT_LABELS,
} from "./agentApi";

interface Test {
  id: string;
  parcours: string;
  status: string;
  passeLe: string;
  corrigeLe: string | null;
  scores: {
    lexique: number | null;
    oral: number | null;
    situations: number | null;
    video: number | null;
    essai: number | null;
  };
  totalScore: number | null;
  niveau: string | null;
}

interface NoteClient {
  id: string;
  date: string;
  note: number;
  remarque: string | null;
  clientNom: string;
  role: string;
}

interface LignePaie {
  periode: string;
  clientNom: string;
  netAPayer: number;
  statut: string;
  datePaiement: string | null;
  moyenPaiement: string | null;
}

interface MonCasier {
  prenom: string;
  nom: string;
  tests: Test[] | null;
  notesClient: { moyenne: number | null; liste: NoteClient[] };
  contrat: {
    document: { id: string; filename: string } | null;
    statut: string;
    poste: string | null;
    dateEmbauche: string | null;
    salaireBase: number | null;
  };
  paiements: {
    lignes: LignePaie[];
    parMois: { periode: string; percu: number; enAttente: number }[];
    totalPercu: number;
    totalEnAttente: number;
  };
}

const CARD = "rounded border border-white/10 bg-obsidianCard p-5";
const LABEL = "font-mono text-[11px] uppercase tracking-widest text-white/40";

const PARCOURS_LABELS: Record<string, string> = {
  admission: "Test d'entrée en formation",
  recrutement: "Test de recrutement",
};

const EPREUVES: { cle: keyof Test["scores"]; label: string }[] = [
  { cle: "lexique", label: "Lexique" },
  { cle: "oral", label: "Oral" },
  { cle: "situations", label: "Mises en situation" },
  { cle: "video", label: "Vidéo" },
  { cle: "essai", label: "Essai" },
];

const fmtNote = (n: number | null) => (n === null ? "—" : `${n}/20`);

function Etoiles({ note }: { note: number }) {
  const pleines = Math.round(note);
  return (
    <span aria-label={`${note} sur 5`} className="text-accent">
      {"★".repeat(pleines)}
      <span className="text-white/20">{"★".repeat(5 - pleines)}</span>
    </span>
  );
}

// Mon casier — tout ce que la société garde sur l'agent, vu par l'agent :
// résultats de test, retours du client, contrat, historique de paie et
// somme perçue par mois.
export default function MonCasierAgent() {
  const [data, setData] = useState<MonCasier | "loading" | "erreur">("loading");
  const [telechargement, setTelechargement] = useState(false);

  useEffect(() => {
    const matricule = agentMatricule();
    if (!matricule) {
      setData("erreur");
      return;
    }
    apiGet<MonCasier>(`/agents/${matricule}/mon-casier`)
      .then(setData)
      .catch(() => setData("erreur"));
  }, []);

  async function telechargerContrat(doc: { id: string; filename: string }) {
    const matricule = agentMatricule();
    if (!matricule) return;
    setTelechargement(true);
    try {
      const blob = await apiGetBlob(`/agents/${matricule}/documents/${doc.id}`, {}).catch(
        () => null
      );
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setTelechargement(false);
    }
  }

  if (data === "loading") {
    return <p className="font-sans text-sm text-white/50">Chargement...</p>;
  }
  if (data === "erreur") {
    return (
      <p className="font-sans text-sm text-white/50">
        Impossible de charger votre casier pour le moment.
      </p>
    );
  }

  const { tests, notesClient, contrat, paiements } = data;

  return (
    <div className="space-y-4">
      {/* Résultats de test */}
      <Reveal>
        <div className={CARD}>
          <h3 className="font-display text-lg font-semibold text-white">Mes résultats de test</h3>
          {tests === null ? (
            <p className="mt-3 font-sans text-sm text-white/50">
              Aucun test n&apos;est rattaché à votre compte pour l&apos;instant.
            </p>
          ) : tests.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-white/50">Aucun test passé.</p>
          ) : (
            <div className="mt-3 space-y-4">
              {tests.map((t) => (
                <div key={t.id} className="rounded border border-white/10 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-sans text-sm font-semibold text-white">
                      {PARCOURS_LABELS[t.parcours] ?? t.parcours}
                    </p>
                    <p className="font-mono text-xs text-white/50">
                      Passé le {fmtDate(t.passeLe)}
                      {t.corrigeLe ? ` · corrigé le ${fmtDate(t.corrigeLe)}` : " · en cours de correction"}
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {EPREUVES.map((e) => (
                      <div key={e.cle}>
                        <p className={LABEL}>{e.label}</p>
                        <p className="mt-1 font-sans text-sm text-white">{fmtNote(t.scores[e.cle])}</p>
                      </div>
                    ))}
                    <div>
                      <p className={LABEL}>Total</p>
                      <p className="mt-1 font-sans text-sm font-semibold text-accent">
                        {t.totalScore === null ? "—" : `${t.totalScore}`}
                        {t.niveau ? ` · ${t.niveau}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      {/* Notes du client */}
      <Reveal>
        <div className={CARD}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-lg font-semibold text-white">
              Notes et remarques de mes clients
            </h3>
            {notesClient.moyenne !== null && (
              <p className="font-sans text-sm text-white/70">
                Moyenne : <span className="font-semibold text-accent">{notesClient.moyenne}/5</span>
              </p>
            )}
          </div>
          {notesClient.liste.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-white/50">
              Aucun retour client enregistré pour l&apos;instant.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {notesClient.liste.map((n) => (
                <li key={n.id} className="rounded border border-white/10 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-sans text-sm text-white">
                      {n.clientNom} <span className="text-white/40">· {n.role}</span>
                    </p>
                    <p className="font-mono text-xs text-white/50">{fmtDate(n.date)}</p>
                  </div>
                  <p className="mt-1">
                    <Etoiles note={n.note} /> <span className="ml-1 font-sans text-sm text-white">{n.note}/5</span>
                  </p>
                  {n.remarque && (
                    <p className="mt-2 border-l-2 border-accent/40 pl-3 font-sans text-sm italic text-white/70">
                      « {n.remarque} »
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Reveal>

      {/* Contrat */}
      <Reveal>
        <div className={CARD}>
          <h3 className="font-display text-lg font-semibold text-white">Mon contrat avec e-Staf</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className={LABEL}>Statut</p>
              <p className="mt-1 font-sans text-sm text-white">
                {STATUT_AGENT_LABELS[contrat.statut] ?? contrat.statut}
              </p>
            </div>
            <div>
              <p className={LABEL}>Poste</p>
              <p className="mt-1 font-sans text-sm text-white">{contrat.poste ?? "—"}</p>
            </div>
            <div>
              <p className={LABEL}>Date d&apos;embauche</p>
              <p className="mt-1 font-sans text-sm text-white">{fmtDate(contrat.dateEmbauche)}</p>
            </div>
            <div>
              <p className={LABEL}>Fixe mensuel</p>
              <p className="mt-1 font-sans text-sm text-white">{fmtMontant(contrat.salaireBase)}</p>
            </div>
          </div>
          <div className="mt-4 border-t border-white/10 pt-4">
            {contrat.document ? (
              <button
                type="button"
                onClick={() => telechargerContrat(contrat.document!)}
                disabled={telechargement}
                className="rounded border border-accent/50 px-3 py-2 font-sans text-sm text-accent hover:bg-accent/10 disabled:opacity-40"
              >
                {telechargement ? "Téléchargement..." : `⬇ ${contrat.document.filename}`}
              </button>
            ) : (
              <p className="font-sans text-sm text-white/50">
                Votre contrat n&apos;a pas encore été déposé par la RH.
              </p>
            )}
          </div>
        </div>
      </Reveal>

      {/* Somme perçue par mois + historique */}
      <Reveal>
        <div className={CARD}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-lg font-semibold text-white">Somme perçue par mois</h3>
            <p className="font-sans text-sm text-white/70">
              Total perçu :{" "}
              <span className="font-semibold text-accent">{fmtMontant(paiements.totalPercu)}</span>
              {paiements.totalEnAttente > 0 && (
                <span className="text-white/50"> · {fmtMontant(paiements.totalEnAttente)} en attente</span>
              )}
            </p>
          </div>
          {paiements.parMois.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-white/50">Aucun paiement pour l&apos;instant.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[420px] text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className={`${LABEL} py-2`}>Mois</th>
                    <th className={`${LABEL} py-2`}>Perçu</th>
                    <th className={`${LABEL} py-2`}>En attente</th>
                  </tr>
                </thead>
                <tbody>
                  {paiements.parMois.map((m) => (
                    <tr key={m.periode} className="border-b border-white/5">
                      <td className="py-2 font-mono text-xs text-white/70">{fmtPeriode(m.periode)}</td>
                      <td className="py-2 font-sans text-sm font-semibold text-accent">
                        {fmtMontant(m.percu)}
                      </td>
                      <td className="py-2 font-sans text-sm text-white/60">
                        {m.enAttente > 0 ? fmtMontant(m.enAttente) : "—"}
                      </td>
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
          {paiements.lignes.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-white/50">Aucun paiement pour l&apos;instant.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    {["Période", "Client", "Net", "Statut", "Payé le", "Moyen"].map((h) => (
                      <th key={h} className={`${LABEL} py-2 pr-3`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paiements.lignes.map((l, i) => (
                    <tr key={`${l.periode}-${i}`} className="border-b border-white/5">
                      <td className="py-2 pr-3 font-mono text-xs text-white/70">{fmtPeriode(l.periode)}</td>
                      <td className="py-2 pr-3 font-sans text-sm text-white">{l.clientNom}</td>
                      <td className="py-2 pr-3 font-sans text-sm text-accent">{fmtMontant(l.netAPayer)}</td>
                      <td className="py-2 pr-3 font-sans text-sm text-white/70">
                        {l.statut === "paye" ? "Payé" : "En attente"}
                      </td>
                      <td className="py-2 pr-3 font-sans text-sm text-white/70">{fmtDate(l.datePaiement)}</td>
                      <td className="py-2 font-sans text-sm text-white/70">{l.moyenPaiement ?? "—"}</td>
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
