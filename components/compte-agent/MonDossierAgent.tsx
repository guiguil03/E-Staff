"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet, apiGetBlob } from "@/lib/api";
import {
  agentMatricule,
  fmtDate,
  fmtMontant,
  fmtTaux,
  STATUT_AGENT_LABELS,
} from "./agentApi";

interface DocumentApi {
  id: string;
  filename: string;
  type: string;
  createdAt: string;
}

interface MissionApi {
  id: string;
  clientNom: string;
  role: string;
  dateDebut: string;
  dateFin: string | null;
  superviseurNom: string | null;
  qualityScore: number | null;
  tarifNegocie: number | null;
  objectifJournalier: number | null;
  objectifHebdo: number | null;
  synthese: { joursSaisis: number; tauxMoyen: number | null; joursObjectifAtteint: number };
}

interface DossierAgent {
  matricule: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
  poste: string | null;
  statut: string;
  dateEmbauche: string | null;
  salaireBase: number | null;
  coordonneesPaiement: { type: string; numero: string; verifieLe: string | null } | null;
  contrat: DocumentApi | null;
  autresDocuments: DocumentApi[];
  missions: MissionApi[];
}

const CARD = "rounded border border-white/10 bg-obsidianCard p-5";
const LABEL = "font-mono text-[11px] uppercase tracking-widest text-white/40";

// Mon dossier — le casier de l'agent vu par l'agent : son identité, son
// contrat de travail (déposé par la RH, téléchargeable) et l'historique de
// ses missions avec la synthèse de ses objectifs sur chacune.
export default function MonDossierAgent() {
  const [dossier, setDossier] = useState<DossierAgent | "loading" | "erreur">("loading");
  const [telechargement, setTelechargement] = useState<string | null>(null);

  useEffect(() => {
    const matricule = agentMatricule();
    if (!matricule) {
      setDossier("erreur");
      return;
    }
    apiGet<DossierAgent>(`/agents/${matricule}/dossier`)
      .then(setDossier)
      .catch(() => setDossier("erreur"));
  }, []);

  async function telecharger(doc: DocumentApi) {
    const matricule = agentMatricule();
    if (!matricule) return;
    setTelechargement(doc.id);
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
      setTelechargement(null);
    }
  }

  if (dossier === "loading") {
    return <p className="font-sans text-sm text-white/50">Chargement...</p>;
  }
  if (dossier === "erreur") {
    return (
      <p className="font-sans text-sm text-white/50">
        Impossible de charger votre dossier pour le moment.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Reveal>
        <div className={CARD}>
          <h3 className="font-display text-lg font-semibold text-white">Mes informations</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className={LABEL}>Matricule</p>
              <p className="mt-1 font-mono text-sm text-white">{dossier.matricule}</p>
            </div>
            <div>
              <p className={LABEL}>Nom</p>
              <p className="mt-1 font-sans text-sm text-white">
                {dossier.prenom} {dossier.nom}
              </p>
            </div>
            <div>
              <p className={LABEL}>Statut</p>
              <p className="mt-1 font-sans text-sm text-white">
                {STATUT_AGENT_LABELS[dossier.statut] ?? dossier.statut}
              </p>
            </div>
            <div>
              <p className={LABEL}>E-mail</p>
              <p className="mt-1 font-sans text-sm text-white">{dossier.email}</p>
            </div>
            <div>
              <p className={LABEL}>Téléphone</p>
              <p className="mt-1 font-sans text-sm text-white">{dossier.telephone ?? "—"}</p>
            </div>
            <div>
              <p className={LABEL}>Poste</p>
              <p className="mt-1 font-sans text-sm text-white">{dossier.poste ?? "—"}</p>
            </div>
            <div>
              <p className={LABEL}>Date d&apos;embauche</p>
              <p className="mt-1 font-sans text-sm text-white">{fmtDate(dossier.dateEmbauche)}</p>
            </div>
            <div>
              <p className={LABEL}>Salaire de base</p>
              <p className="mt-1 font-sans text-sm text-white">
                {fmtMontant(dossier.salaireBase)}
              </p>
            </div>
            <div>
              <p className={LABEL}>Coordonnées de paiement</p>
              <p className="mt-1 font-sans text-sm text-white">
                {dossier.coordonneesPaiement
                  ? `${dossier.coordonneesPaiement.type} · ${dossier.coordonneesPaiement.numero}`
                  : "Non renseignées"}
              </p>
              {dossier.coordonneesPaiement?.verifieLe && (
                <p className="mt-0.5 font-sans text-xs text-white/40">
                  Vérifiées le {fmtDate(dossier.coordonneesPaiement.verifieLe)}
                </p>
              )}
            </div>
          </div>
          <p className="mt-4 font-sans text-xs text-white/40">
            Une information à corriger (téléphone, coordonnées de paiement) ? Contactez la RH :
            c&apos;est elle qui met à jour votre dossier, après vérification.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <div className={CARD}>
          <h3 className="font-display text-lg font-semibold text-white">Mon contrat</h3>
          {dossier.contrat ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded border border-white/10 bg-obsidian px-4 py-3">
              <div>
                <p className="font-sans text-sm text-white">{dossier.contrat.filename}</p>
                <p className="mt-0.5 font-sans text-xs text-white/40">
                  Déposé le {fmtDate(dossier.contrat.createdAt)}
                </p>
              </div>
              <button
                onClick={() => telecharger(dossier.contrat as DocumentApi)}
                disabled={telechargement === dossier.contrat.id}
                className="rounded border border-accent px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-accent transition-colors hover:bg-accent hover:text-obsidian disabled:opacity-50"
              >
                {telechargement === dossier.contrat.id ? "..." : "Télécharger"}
              </button>
            </div>
          ) : (
            <p className="mt-3 font-sans text-sm text-white/50">
              Aucun contrat n&apos;a encore été déposé par la RH sur votre dossier.
            </p>
          )}

          {dossier.autresDocuments.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className={LABEL}>Autres documents</p>
              {dossier.autresDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded border border-white/10 bg-obsidian px-4 py-2"
                >
                  <p className="font-sans text-sm text-white">{doc.filename}</p>
                  <button
                    onClick={() => telecharger(doc)}
                    disabled={telechargement === doc.id}
                    className="font-mono text-[11px] uppercase tracking-widest text-accent hover:underline disabled:opacity-50"
                  >
                    {telechargement === doc.id ? "..." : "Télécharger"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      <Reveal>
        <div className={CARD}>
          <h3 className="font-display text-lg font-semibold text-white">Mes missions</h3>
          {dossier.missions.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-white/50">
              Aucune mission enregistrée pour l&apos;instant.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className={`${LABEL} py-2`}>Client</th>
                    <th className={`${LABEL} py-2`}>Poste</th>
                    <th className={`${LABEL} py-2`}>Période</th>
                    <th className={`${LABEL} py-2`}>Superviseur</th>
                    <th className={`${LABEL} py-2`}>Objectifs (j / sem.)</th>
                    <th className={`${LABEL} py-2`}>Taux moyen</th>
                    <th className={`${LABEL} py-2`}>Qualité</th>
                  </tr>
                </thead>
                <tbody>
                  {dossier.missions.map((m) => (
                    <tr key={m.id} className="border-b border-white/5">
                      <td className="py-2 font-sans text-sm text-white">{m.clientNom}</td>
                      <td className="py-2 font-sans text-sm text-white/70">{m.role}</td>
                      <td className="py-2 font-mono text-xs text-white/70">
                        {fmtDate(m.dateDebut)} → {m.dateFin ? fmtDate(m.dateFin) : "en cours"}
                      </td>
                      <td className="py-2 font-sans text-sm text-white/70">
                        {m.superviseurNom ?? "—"}
                      </td>
                      <td className="py-2 font-mono text-xs text-white/70">
                        {m.objectifJournalier ?? "—"} / {m.objectifHebdo ?? "—"}
                      </td>
                      <td className="py-2 font-sans text-sm text-accent">
                        {fmtTaux(m.synthese.tauxMoyen)}
                      </td>
                      <td className="py-2 font-sans text-sm text-white/70">
                        {m.qualityScore !== null ? `${m.qualityScore}/5` : "—"}
                      </td>
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
