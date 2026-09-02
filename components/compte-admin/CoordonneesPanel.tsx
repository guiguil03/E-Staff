"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { apiGet } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface CoordonneesRow {
  attemptId: string;
  candidatId: string;
  nomComplet: string;
  email: string;
  phone: string;
  cvDisponible: boolean;
  videoResponseIds: string[];
  matricule: string | null;
  typeCours: string | null;
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/+$/, "");

// Tableau consolidé — une ligne par candidat avec ses coordonnées, son CV
// (s'il a été déposé à l'étape "Coordonnées" du test) et les liens vers ses
// vidéos de test (Bloc 5), qui étaient jusqu'ici éparpillés entre le
// Cycle complet, la fiche candidat et l'écran de correction formateur. Voir
// RhService.getCoordonnees.
export default function CoordonneesPanel() {
  const [rows, setRows] = useState<CoordonneesRow[] | "loading" | "erreur">("loading");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    apiGet<CoordonneesRow[]>("/rh/coordonnees", adminHeaders())
      .then(setRows)
      .catch(() => setRows("erreur"));
  }, []);

  const filtered = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.nomComplet, r.email, r.phone, r.matricule, r.typeCours]
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
              Coordonnées — candidats &amp; apprenants
            </h3>
            <p className="mt-1 font-sans text-xs text-white/50">
              Contact, CV et vidéos de test regroupés en un seul tableau.
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
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 font-mono text-[11px] uppercase tracking-widest text-white/40">
                  <th className="py-2 pr-4">Candidat</th>
                  <th className="py-2 pr-4">Téléphone</th>
                  <th className="py-2 pr-4">Formation</th>
                  <th className="py-2 pr-4">CV</th>
                  <th className="py-2 pr-4">Vidéos du test</th>
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
                        {r.nomComplet}
                      </Link>
                      <span className="block font-mono text-[11px] text-white/40">{r.email}</span>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs">{r.phone}</td>
                    <td className="py-2.5 pr-4">
                      {r.matricule ? (
                        <>
                          <span className="block font-mono text-xs text-accent">{r.matricule}</span>
                          <span className="block text-[11px] text-white/50">{r.typeCours ?? "—"}</span>
                        </>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4">
                      {r.cvDisponible ? (
                        <a
                          href={`${API_URL}/evaluation/candidats/${r.candidatId}/cv`}
                          className="font-mono text-xs text-accent hover:underline"
                        >
                          Voir le CV
                        </a>
                      ) : (
                        <span className="font-mono text-xs text-white/30">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4">
                      {r.videoResponseIds.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {r.videoResponseIds.map((id, i) => (
                            <a
                              key={id}
                              href={`${API_URL}/evaluation/video-responses/${id}/video`}
                              className="font-mono text-xs text-accent hover:underline"
                            >
                              Vidéo {i + 1}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="font-mono text-xs text-white/30">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center font-sans text-sm text-white/40">
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
