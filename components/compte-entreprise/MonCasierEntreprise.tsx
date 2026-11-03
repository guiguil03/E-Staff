"use client";

import { useEffect, useState } from "react";
import { apiGet, apiGetBlob } from "@/lib/api";
import { entrepriseMatricule, fmtDate, fmtMontant, fmtPeriode } from "./entrepriseApi";

interface MonCasier {
  entreprise: { matricule: string; raisonSociale: string; contactNom: string; email: string; telephone: string | null };
  documents: { id: string; type: string; filename: string; createdAt: string }[];
  factures: { id: string; periode: string; montant: number; statut: string; dateEmission: string; datePaiement: string | null; clientNom: string }[];
}

const CARD = "rounded border border-white/10 bg-obsidianCard p-5";
const LABEL = "font-mono text-[11px] uppercase tracking-widest text-white/40";
const BTN_GHOST =
  "rounded border border-white/20 px-3 py-1.5 font-sans text-xs text-white/80 hover:border-accent hover:text-accent disabled:opacity-40";
const messageErreur = (e: unknown) => (e instanceof Error ? e.message : "Une erreur est survenue.");

// Mon casier (entreprise) : contrat e-Staf déposé par la RH et factures de
// vos contrats — même principe que MonCasierSuperviseur/MonCasierAgent.
export default function MonCasierEntreprise() {
  const [data, setData] = useState<MonCasier | "loading" | "erreur">("loading");
  const [erreur, setErreur] = useState<string | null>(null);
  const matricule = entrepriseMatricule();

  useEffect(() => {
    if (!matricule) {
      setData("erreur");
      return;
    }
    apiGet<MonCasier>(`/entreprises-comptes/${matricule}/mon-casier`).then(setData).catch(() => setData("erreur"));
  }, [matricule]);

  async function telechargerDocument(id: string, filename: string) {
    setErreur(null);
    try {
      const blob = await apiGetBlob(`/entreprises-comptes/${matricule}/documents/${id}`, {});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErreur(messageErreur(e));
    }
  }

  async function telechargerFacture(id: string) {
    setErreur(null);
    try {
      const blob = await apiGetBlob(`/entreprises-comptes/${matricule}/factures/${id}/pdf`, {});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `facture-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErreur(messageErreur(e));
    }
  }

  if (data === "loading") return <p className="font-sans text-sm text-white/50">Chargement...</p>;
  if (data === "erreur") {
    return <p className="font-sans text-sm text-white/50">Impossible de charger votre casier pour le moment.</p>;
  }

  return (
    <div className="space-y-4">
      {erreur && (
        <p className="rounded border border-statusRed/40 bg-statusRed/10 px-3 py-2 font-sans text-sm text-statusRed">{erreur}</p>
      )}

      <div className={CARD}>
        <h3 className="font-display text-lg font-semibold text-white">Mes informations</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className={LABEL}>Matricule</p>
            <p className="mt-1 font-sans text-sm text-white">{data.entreprise.matricule}</p>
          </div>
          <div>
            <p className={LABEL}>Raison sociale</p>
            <p className="mt-1 font-sans text-sm text-white">{data.entreprise.raisonSociale}</p>
          </div>
          <div>
            <p className={LABEL}>Contact</p>
            <p className="mt-1 font-sans text-sm text-white">{data.entreprise.contactNom}</p>
          </div>
          <div>
            <p className={LABEL}>E-mail</p>
            <p className="mt-1 break-all font-sans text-sm text-white">{data.entreprise.email}</p>
          </div>
        </div>
      </div>

      <div className={CARD}>
        <h3 className="font-display text-lg font-semibold text-white">Contrat e-Staf</h3>
        {data.documents.length === 0 ? (
          <p className="mt-3 font-sans text-sm text-white/50">Aucun document déposé pour l&apos;instant.</p>
        ) : (
          <ul className="mt-3 divide-y divide-white/5">
            {data.documents.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <p className="font-sans text-sm text-white">
                  {d.filename}
                  <span className="ml-2 font-mono text-[11px] text-white/40">{fmtDate(d.createdAt)}</span>
                </p>
                <button className={BTN_GHOST} onClick={() => telechargerDocument(d.id, d.filename)}>
                  ⬇ Télécharger
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={CARD}>
        <h3 className="font-display text-lg font-semibold text-white">Mes factures</h3>
        {data.factures.length === 0 ? (
          <p className="mt-3 font-sans text-sm text-white/50">Aucune facture pour l&apos;instant.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b border-white/10">
                  {["Période", "Contrat", "Montant", "Statut", "Émise le", ""].map((h) => (
                    <th key={h} className={`${LABEL} py-2 pr-3`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.factures.map((f) => (
                  <tr key={f.id} className="border-b border-white/5">
                    <td className="py-2 pr-3 font-mono text-xs text-white/70">{fmtPeriode(f.periode)}</td>
                    <td className="py-2 pr-3 font-sans text-sm text-white">{f.clientNom}</td>
                    <td className="py-2 pr-3 font-sans text-sm font-semibold text-accent">{fmtMontant(f.montant)}</td>
                    <td className="py-2 pr-3 font-sans text-sm text-white/70">{f.statut === "payee" ? "Payée" : "Émise"}</td>
                    <td className="py-2 pr-3 font-sans text-sm text-white/70">{fmtDate(f.dateEmission)}</td>
                    <td className="py-2">
                      <button className={BTN_GHOST} onClick={() => telechargerFacture(f.id)}>
                        ⬇ PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
