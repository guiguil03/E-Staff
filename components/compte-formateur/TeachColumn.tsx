"use client";

import { useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import ClasseVirtuelleJoinButton from "./ClasseVirtuelleJoinButton";

// Colonne "Enseigner" — dépôt des objectifs J-7 et accès à la classe
// virtuelle. Pas de backend de dépôt de fichiers/cours pour l'instant : les
// objectifs restent en mémoire de session (honnête, pas de fausse
// persistance) ; la classe virtuelle est un état "bientôt disponible"
// comme le reste des liens externes non encore configurés sur le site.
export default function TeachColumn() {
  const [objectifs, setObjectifs] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
  }

  return (
    <Reveal className="h-full">
      <div className="h-full rounded border border-white/10 bg-obsidianCard p-6">
        <h3 className="font-display text-base font-semibold text-white">Enseigner</h3>

        <div className="mt-4 rounded border border-accent bg-accent/10 p-4 text-center">
          <div className="mt-3">
            <ClasseVirtuelleJoinButton />
          </div>
        </div>

        <div className="mt-5">
          <label
            htmlFor="objectifs-semaine"
            className="block font-sans text-sm font-medium text-white/80"
          >
            Objectifs & critères — semaine prochaine (J-7)
          </label>
          <textarea
            id="objectifs-semaine"
            rows={4}
            value={objectifs}
            onChange={(e) => {
              setObjectifs(e.target.value);
              setSaved(false);
            }}
            placeholder="Ex. Atelier posture non-verbale, critères : fluidité, contact visuel, gestuelle..."
            className="mt-2 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
          />
          <div className="mt-2 flex items-center gap-3">
            <Button variant="ghostDark" onClick={handleSave} disabled={!objectifs.trim()}>
              Enregistrer
            </Button>
            {saved && (
              <p className="font-sans text-xs text-success">
                Objectifs enregistrés pour cette session.
              </p>
            )}
          </div>
        </div>

        <Link
          href="/compte/formateur/planning"
          className="mt-5 flex items-center justify-between rounded border border-white/10 bg-obsidian px-3 py-2.5 font-sans text-sm text-white transition-colors hover:border-accent/50"
        >
          Planning par Groupe &amp; Moyenne de Séance
          <span aria-hidden="true" className="text-accent">
            →
          </span>
        </Link>
      </div>
    </Reveal>
  );
}
