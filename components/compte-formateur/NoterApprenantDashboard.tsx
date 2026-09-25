"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { useRequireRole } from "@/lib/useRequireRole";
import { apiGet } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";
import { apprenantMatricule } from "./exampleData";
import NotationCompetencesPanel from "./NotationCompetencesPanel";

interface NoterApprenantDashboardProps {
  apprenantId: string;
  seance: number;
  groupe: string;
}

interface ApprenantListApi {
  matricule: string;
  prenom: string;
  nom: string;
  groupeCle: string;
}

function formateurHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-formateur-matricule": matricule } : {};
}

// Page dédiée "Noter la séance" — étape "choix de la compétence puis
// grille" du parcours décrit par la cliente : Bouton Noter (sur le tableau
// récap de Planning) → cette page → 5 compétences → grille (ou dépôt +
// note pour les 2 compétences de compréhension). Persisté en base
// (table Notation) depuis le 2026-08-07. La notation elle-même vit dans
// NotationCompetencesPanel, partagé avec le panneau latéral de la classe
// virtuelle (noter pendant le cours).
export default function NoterApprenantDashboard({
  apprenantId,
  seance,
  groupe,
}: NoterApprenantDashboardProps) {
  const checked = useRequireRole("formateur");
  // Branché sur /cockpit/apprenants depuis le 2026-09-22 — le prénom/nom
  // affichés venaient avant d'exampleData.ts (30 faux apprenants), la vraie
  // notation étant déjà persistée sous le bon matricule depuis longtemps.
  const [apprenant, setApprenant] = useState<ApprenantListApi | null | "loading">("loading");

  const matricule = apprenantMatricule(apprenantId);
  const backHref = `/compte/formateur/planning?groupe=${groupe}&seance=${seance}`;

  useEffect(() => {
    if (!checked) return;
    apiGet<ApprenantListApi[]>("/cockpit/apprenants", formateurHeaders())
      .then((list) => setApprenant(list.find((a) => a.matricule === matricule) ?? null))
      .catch(() => setApprenant(null));
  }, [checked, matricule]);

  if (!checked || apprenant === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <p className="font-sans text-sm text-white/50">Chargement...</p>
      </div>
    );
  }

  if (!apprenant) {
    return (
      <div className="min-h-screen bg-obsidian px-4 py-10 text-center">
        <p className="font-sans text-sm text-white/50">Apprenant introuvable.</p>
        <Link
          href={backHref}
          className="mt-4 inline-block font-mono text-xs uppercase tracking-widest text-accent hover:underline"
        >
          ← Retour au planning
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Link
          href={backHref}
          className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
        >
          ← Retour au planning
        </Link>

        <Reveal>
          <h1 className="mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
            {apprenant.prenom} {apprenant.nom}
          </h1>
          <p className="mt-1 font-sans text-sm text-white/60">
            Groupe {apprenant.groupeCle} — Séance n°{seance}
          </p>
        </Reveal>

        <Reveal delay={40}>
          <div className="mt-6 rounded border border-white/10 bg-obsidianCard p-6">
            <NotationCompetencesPanel groupe={groupe} seance={seance} matricule={matricule} />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
