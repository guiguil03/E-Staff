import Link from "next/link";
import Reveal from "@/components/Reveal";
import { APPRENANTS, SUBMISSION_QUEUE } from "./exampleData";

// Résumé de la file de correction, avec lien vers la page dédiée
// /compte/formateur/corriger (plutôt qu'un panneau embarqué — pages
// dédiées pour tout ce qui a un contenu conséquent, cf. Compte Apprenant).
export default function GradingQueueSummaryCard() {
  const preview = SUBMISSION_QUEUE.slice(0, 3);

  return (
    <Reveal className="h-full">
      <div className="flex h-full flex-col rounded border border-white/10 bg-obsidianCard p-6">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-base font-semibold text-white">
            Évaluer &amp; Corriger
          </h3>
          <span className="font-mono text-xs text-white/50">
            {SUBMISSION_QUEUE.length} en attente
          </span>
        </div>

        <ul className="mt-4 space-y-2">
          {preview.map((item) => {
            const apprenant = APPRENANTS.find((a) => a.id === item.apprenantId);
            return (
              <li
                key={item.id}
                className="rounded border border-white/10 bg-obsidian px-3 py-2"
              >
                <p className="font-sans text-sm text-white">
                  {apprenant?.firstName} {apprenant?.lastName} — {item.exercice}
                </p>
                <p className="font-mono text-[11px] text-white/40">
                  {item.type} · {item.soumisDepuis}
                </p>
              </li>
            );
          })}
        </ul>

        <Link
          href="/compte/formateur/corriger"
          className="mt-4 inline-flex items-center gap-1.5 font-sans text-sm font-medium text-accent hover:underline"
        >
          Accéder à la correction →
        </Link>
      </div>
    </Reveal>
  );
}
