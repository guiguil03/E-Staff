"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { apiGet } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

function formateurHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-formateur-matricule": matricule } : {};
}

// Bandeau ajouté le 2026-08-24 : le Cockpit Formateur (login par matricule)
// et l'espace de correction des tests d'admission (/evaluation/formateur,
// login par code partagé distinct — voir TrainerGuard) sont deux systèmes
// séparés qui ne se voyaient pas l'un l'autre, ce qui rendait les tests
// soumis invisibles depuis ici. Ce bandeau se contente de signaler le
// nombre de tentatives en attente (via un compteur seul, gardé par le
// matricule du Cockpit — pas les données des candidats, réservées au vrai
// code formateur) et renvoie vers /evaluation/formateur pour corriger.
export default function AdmissionTestsCard() {
  const [count, setCount] = useState<number | "loading" | "erreur">("loading");

  useEffect(() => {
    apiGet<number>("/evaluation/attempts-pending-count", formateurHeaders())
      .then(setCount)
      .catch(() => setCount("erreur"));
  }, []);

  const pending = typeof count === "number" ? count : 0;
  const highlight = pending > 0;

  return (
    <Reveal>
      <Link
        href="/evaluation/formateur"
        className={`flex flex-wrap items-center justify-between gap-3 rounded border p-4 transition-colors ${
          highlight
            ? "border-accent bg-accent/10 hover:bg-accent/15"
            : "border-white/10 bg-obsidianCard hover:border-accent/40"
        }`}
      >
        <div>
          <h3 className="font-display text-sm font-semibold text-white">
            Tests d&apos;admission à corriger
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-white/40">
            Mises en situation &amp; vidéos des candidats — espace séparé, code formateur requis
          </p>
        </div>
        <span className={`font-mono text-sm ${highlight ? "text-accent" : "text-white/50"}`}>
          {count === "loading" && "Chargement..."}
          {count === "erreur" && "Indisponible"}
          {typeof count === "number" && `${count} tentative${count > 1 ? "s" : ""} en attente →`}
        </span>
      </Link>
    </Reveal>
  );
}
