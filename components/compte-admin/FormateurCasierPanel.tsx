"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiGet, apiGetBlob, apiUpload } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface Vague {
  label: string;
  typeCours: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  apprenantsCount: number;
  tauxReussite: number;
}

interface DocumentApi {
  id: string;
  filename: string;
  createdAt: string;
}

interface BilanApi {
  id: string;
  constat: string;
  analyse: string;
  axes: string;
  createdAt: string;
}

interface FormateurCasier {
  matricule: string;
  prenom: string;
  nom: string;
  email: string;
  vivierCount: number;
  vagues: Vague[];
  contrat: DocumentApi | null;
  fichesPreparation: DocumentApi[];
  bilans: BilanApi[];
}

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
}

async function downloadDocument(doc: DocumentApi) {
  const blob = await apiGetBlob(`/rh/formateurs/documents/${doc.id}`, adminHeaders()).catch(
    () => null
  );
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = doc.filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Casier formateur côté RH — état actuel (vagues encadrées, taux de
// réussite réel par vague, vivier C1, bilans hebdo, contrat et fiches de
// prép) plutôt qu'un journal des réaffectations passées : aucune table
// d'historique n'existe pour Groupe.formateurId (voir RhService.getFormateurCasier).
export default function FormateurCasierPanel({ id }: { id: string }) {
  const [casier, setCasier] = useState<FormateurCasier | "loading" | "erreur">("loading");
  const [contratFile, setContratFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "error">("idle");

  function reload() {
    apiGet<FormateurCasier>(`/rh/formateurs/${id}/casier`, adminHeaders())
      .then(setCasier)
      .catch(() => setCasier("erreur"));
  }

  useEffect(reload, [id]);

  async function uploadContrat() {
    if (!contratFile) return;
    setUploadStatus("uploading");
    try {
      const formData = new FormData();
      formData.append("file", contratFile);
      await apiUpload(`/rh/formateurs/${id}/contrat`, formData, adminHeaders());
      setUploadStatus("idle");
      setContratFile(null);
      reload();
    } catch {
      setUploadStatus("error");
    }
  }

  if (casier === "loading") return <p className="font-sans text-sm text-white/50">Chargement...</p>;
  if (casier === "erreur")
    return <p className="font-sans text-sm text-white/50">Erreur de chargement.</p>;

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <p className="font-display text-lg font-semibold text-white">
            {casier.prenom} {casier.nom}
          </p>
          <p className="font-mono text-xs text-white/40">
            {casier.matricule} · {casier.email}
          </p>
          <p className="mt-2 font-mono text-xs text-accent">
            Vivier C1 : {casier.vivierCount} apprenant{casier.vivierCount > 1 ? "s" : ""}
          </p>
        </div>
      </Reveal>

      <Reveal delay={40}>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <h3 className="font-display text-base font-semibold text-white">Contrat</h3>
          {casier.contrat ? (
            <button
              onClick={() => downloadDocument(casier.contrat!)}
              className="mt-3 flex w-full items-center justify-between rounded border border-white/10 bg-obsidian p-3 text-left hover:border-accent/40"
            >
              <span className="font-sans text-sm text-white">{casier.contrat.filename}</span>
              <span className="font-mono text-[11px] text-white/40">
                Déposé le {fmtDate(casier.contrat.createdAt)}
              </span>
            </button>
          ) : (
            <p className="mt-2 font-sans text-sm text-white/50">Aucun contrat déposé.</p>
          )}
          <div className="mt-3 flex items-center gap-3">
            <input
              type="file"
              onChange={(e) => setContratFile(e.target.files?.[0] ?? null)}
              className="font-sans text-xs text-white/60 file:mr-3 file:rounded file:border file:border-white/20 file:bg-obsidian file:px-2 file:py-1 file:text-white/80"
            />
            <Button
              variant="ghostDark"
              onClick={uploadContrat}
              disabled={!contratFile || uploadStatus === "uploading"}
            >
              {uploadStatus === "uploading" ? "Envoi..." : "Déposer"}
            </Button>
          </div>
          {uploadStatus === "error" && (
            <p className="mt-2 font-mono text-xs text-accent">Erreur — réessayer.</p>
          )}
        </div>
      </Reveal>

      <Reveal delay={60}>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <h3 className="font-display text-base font-semibold text-white">Fiches de préparation</h3>
          <div className="mt-3 space-y-2">
            {casier.fichesPreparation.length === 0 && (
              <p className="font-sans text-sm text-white/50">Aucune fiche déposée.</p>
            )}
            {casier.fichesPreparation.map((doc) => (
              <button
                key={doc.id}
                onClick={() => downloadDocument(doc)}
                className="flex w-full items-center justify-between rounded border border-white/10 bg-obsidian p-3 text-left hover:border-accent/40"
              >
                <span className="font-sans text-sm text-white">{doc.filename}</span>
                <span className="font-mono text-[11px] text-white/40">{fmtDate(doc.createdAt)}</span>
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <h3 className="font-display text-base font-semibold text-white">Bilans hebdomadaires</h3>
          <div className="mt-3 space-y-3">
            {casier.bilans.length === 0 && (
              <p className="font-sans text-sm text-white/50">Aucun bilan validé pour l&apos;instant.</p>
            )}
            {casier.bilans.map((b) => (
              <div key={b.id} className="rounded border border-white/10 bg-obsidian p-3">
                <p className="font-mono text-[11px] text-white/40">{fmtDate(b.createdAt)}</p>
                <p className="mt-2 font-sans text-sm text-white/80">
                  <span className="text-white/50">Constat — </span>
                  {b.constat}
                </p>
                <p className="mt-1 font-sans text-sm text-white/80">
                  <span className="text-white/50">Analyse — </span>
                  {b.analyse}
                </p>
                <p className="mt-1 font-sans text-sm text-white/80">
                  <span className="text-white/50">Axes — </span>
                  {b.axes}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={100}>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <h3 className="font-display text-base font-semibold text-white">Vagues encadrées</h3>
          <div className="mt-4 space-y-2">
            {casier.vagues.length === 0 && (
              <p className="font-sans text-sm text-white/50">Aucun groupe assigné actuellement.</p>
            )}
            {casier.vagues.map((v) => (
              <div key={v.label} className="rounded border border-white/10 bg-obsidian p-3">
                <p className="font-sans text-sm text-white">
                  {v.label}
                  {v.typeCours && <span className="text-white/50"> — {v.typeCours}</span>}
                </p>
                <p className="mt-1 font-mono text-[11px] text-white/40">
                  {fmtDate(v.dateDebut)} → {fmtDate(v.dateFin)} · {v.apprenantsCount} apprenant
                  {v.apprenantsCount > 1 ? "s" : ""}
                </p>
                <p className="mt-1 font-mono text-xs text-accent">
                  Taux de réussite : {v.tauxReussite}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
