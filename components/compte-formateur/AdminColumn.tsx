"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiGet } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";
import { APPRENANTS, BROADCAST_TARGETS, apprenantIdFromMatricule } from "./exampleData";

interface VivierApprenantApi {
  matricule: string;
  prenom: string;
  nom: string;
  groupeCle: string;
  moyenneGlobale: number;
}

function formateurHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-formateur-matricule": matricule } : {};
}

interface ApprenantPickerProps {
  onSelectApprenant: (id: string) => void;
}

interface ReportProps {
  onOpenReport: () => void;
}

// "Administrer & Communiquer" — quatre tuiles indépendantes (recherche,
// diffusion, vivier C1, rapport hebdo) plutôt qu'une colonne empilée : elles
// s'intègrent individuellement à la grille bento du Cockpit Formateur, avec
// h-full pour s'aligner sur la hauteur de leurs voisines de rangée. Pointage
// et diffusion restent en état local (pas de backend de présence/messagerie
// pour l'instant) ; honnête sur ce qui est simulé vs. vraiment envoyé.
export function SearchApprenantCard({ onSelectApprenant }: ApprenantPickerProps) {
  const [search, setSearch] = useState("");

  const filteredApprenants = search.trim()
    ? APPRENANTS.filter((a) =>
        `${a.firstName} ${a.lastName}`.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <Reveal className="h-full">
      <div className="h-full rounded border border-white/10 bg-obsidianCard p-6">
        <h3 className="font-display text-base font-semibold text-white">
          Recherche d&apos;un apprenant
        </h3>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nom, prénom..."
          className="mt-2 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
        />
        {filteredApprenants.length > 0 && (
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
            {filteredApprenants.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => onSelectApprenant(a.id)}
                  className="w-full rounded px-2 py-1.5 text-left font-sans text-sm text-white/80 transition-colors hover:bg-obsidian hover:text-accent"
                >
                  {a.firstName} {a.lastName}{" "}
                  <span className="text-white/40">— Groupe {a.groupe}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Reveal>
  );
}

export function BroadcastCard() {
  const [broadcastTarget, setBroadcastTarget] = useState(BROADCAST_TARGETS[0].key);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastSent, setBroadcastSent] = useState(false);

  function sendBroadcast() {
    setBroadcastSent(true);
    setBroadcastMessage("");
  }

  return (
    <Reveal className="h-full">
      <div className="h-full rounded border border-white/10 bg-obsidianCard p-6">
        <h3 className="font-display text-base font-semibold text-white">Diffuser un message</h3>
        <select
          value={broadcastTarget}
          onChange={(e) => {
            setBroadcastTarget(e.target.value);
            setBroadcastSent(false);
          }}
          className="mt-2 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
        >
          {BROADCAST_TARGETS.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
        <textarea
          rows={3}
          value={broadcastMessage}
          onChange={(e) => {
            setBroadcastMessage(e.target.value);
            setBroadcastSent(false);
          }}
          placeholder="Votre annonce..."
          className="mt-2 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
        />
        <div className="mt-2 flex items-center gap-3">
          <Button variant="ghostDark" onClick={sendBroadcast} disabled={!broadcastMessage.trim()}>
            Diffuser
          </Button>
          {broadcastSent && (
            <p className="font-sans text-xs text-white/50">
              Messagerie en cours de construction — non transmise réellement.
            </p>
          )}
        </div>
      </div>
    </Reveal>
  );
}

// Branché sur les vraies notations (table Notation) depuis 2026-08-24 —
// seuil moyenne globale >= 75/100, voir /cockpit/vivier-c1 et
// backend/src/cockpit/cockpit.service.ts.
export function VivierC1Card({ onSelectApprenant }: ApprenantPickerProps) {
  const [vivierOpen, setVivierOpen] = useState(true);
  const [vivier, setVivier] = useState<VivierApprenantApi[] | "loading" | "erreur">("loading");

  useEffect(() => {
    apiGet<{ globalRate: number; apprenants: VivierApprenantApi[] }>(
      "/cockpit/vivier-c1",
      formateurHeaders()
    )
      .then((data) => setVivier(data.apprenants))
      .catch(() => setVivier("erreur"));
  }, []);

  const count = Array.isArray(vivier) ? vivier.length : 0;

  return (
    <Reveal className="h-full">
      <div className="h-full rounded border border-white/10 bg-obsidianCard p-6">
        <button
          onClick={() => setVivierOpen((v) => !v)}
          className="flex w-full items-center justify-between"
        >
          <h3 className="font-display text-base font-semibold text-white">
            Vivier C1 — Prêt pour placement
          </h3>
          <span className="font-mono text-xs text-accent">
            {vivierOpen ? "▾" : "▸"} {count}
          </span>
        </button>
        {vivierOpen && (
          <>
            {vivier === "loading" && (
              <p className="mt-3 font-sans text-xs text-white/50">Chargement...</p>
            )}
            {vivier === "erreur" && (
              <p className="mt-3 font-sans text-xs text-white/50">
                Impossible de charger le vivier pour le moment.
              </p>
            )}
            {Array.isArray(vivier) && (
              <ul className="mt-3 max-h-56 space-y-1 overflow-y-auto pr-1">
                {vivier.map((a) => (
                  <li key={a.matricule}>
                    <button
                      onClick={() => onSelectApprenant(apprenantIdFromMatricule(a.matricule))}
                      className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left font-sans text-sm text-white/80 transition-colors hover:bg-obsidian hover:text-accent"
                    >
                      <span>
                        {a.prenom} {a.nom}
                      </span>
                      <span className="font-mono text-xs text-success">{a.moyenneGlobale}/100</span>
                    </button>
                  </li>
                ))}
                {vivier.length === 0 && (
                  <p className="font-sans text-xs text-white/50">
                    Aucun apprenant au niveau C1 pour l&apos;instant.
                  </p>
                )}
              </ul>
            )}
            <Button variant="ghostDark" className="mt-3" disabled>
              Exporter le vivier
            </Button>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/30">
              Bientôt disponible
            </p>
          </>
        )}
      </div>
    </Reveal>
  );
}

interface FichesProps {
  onOpenFiches: () => void;
}

export function MesFichesCard({ onOpenFiches }: FichesProps) {
  return (
    <Reveal className="h-full">
      <div className="flex h-full flex-col justify-center rounded border border-white/10 bg-obsidianCard p-6 text-center">
        <h3 className="font-display text-base font-semibold text-white">
          Mes fiches de préparation
        </h3>
        <p className="mt-1 font-sans text-xs text-white/60">
          Déposez les supports que vous comptez utiliser en séance.
        </p>
        <Button variant="ghostDark" className="mt-3" onClick={onOpenFiches}>
          Gérer mes fiches
        </Button>
      </div>
    </Reveal>
  );
}

export function WeeklyReportCard({ onOpenReport }: ReportProps) {
  return (
    <Reveal className="h-full">
      <div className="flex h-full flex-col justify-center rounded border border-accent/30 bg-obsidianCard p-6 text-center">
        <h3 className="font-display text-base font-semibold text-white">
          Rapport hebdomadaire formateur
        </h3>
        <p className="mt-1 font-sans text-xs text-white/60">
          Généré à partir des données de la semaine, à compléter avec votre analyse.
        </p>
        <Button variant="dark" className="mt-3" onClick={onOpenReport}>
          Générer le Bilan de Semaine
        </Button>
      </div>
    </Reveal>
  );
}
