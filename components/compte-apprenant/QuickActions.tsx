import Link from "next/link";
import Reveal from "@/components/Reveal";
import CountdownTimer from "./CountdownTimer";
import ClasseVirtuelleJoinButton from "./ClasseVirtuelleJoinButton";
import { RENDRE_EXERCICE_EVENT } from "./MesNotationsTable";

interface QuickActionsProps {
  prochaineSeance: { titre: string; startAt: string } | null;
}

// Actions non encore reliées à un vrai backend (messagerie formateur) sont affichées honnêtement en état "Bientôt
// disponible" plutôt que comme des liens morts — même logique que
// CalendarEmbed sur /entreprises.
function PlaceholderAction({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between rounded border border-dashed border-white/15 px-4 py-3">
      <span className="font-sans text-sm text-white/50">{label}</span>
      <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">
        Bientôt disponible
      </span>
    </div>
  );
}

// Raccourci vers le dépôt de devoir attendu dans « Mes séances & notation »
// (même page) : voir prochainDepotAttendu.
function RendreExerciceAction() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(RENDRE_EXERCICE_EVENT))}
      className="flex w-full items-center justify-between rounded border border-accent/30 bg-obsidian px-4 py-3 text-left font-sans text-sm text-white transition-colors hover:border-accent"
    >
      Rendre un exercice
      <span aria-hidden="true" className="text-accent">
        →
      </span>
    </button>
  );
}

function LiveAction({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded border border-accent/30 bg-obsidian px-4 py-3 font-sans text-sm text-white transition-colors hover:border-accent"
    >
      {label}
      <span aria-hidden="true" className="text-accent">
        →
      </span>
    </Link>
  );
}

export default function QuickActions({ prochaineSeance }: QuickActionsProps) {
  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <h3 className="font-display text-base font-semibold text-white">
          Prochaine séance
        </h3>
        {prochaineSeance ? (
          <>
            <p className="mt-1 font-sans text-sm text-accent">{prochaineSeance.titre}</p>
            <div className="mt-4">
              <CountdownTimer targetIso={prochaineSeance.startAt} />
            </div>
          </>
        ) : (
          <p className="mt-1 font-sans text-sm text-white/50">
            Aucune séance programmée pour le moment.
          </p>
        )}

        <div className="mt-6 space-y-2">
          <ClasseVirtuelleJoinButton />
          <LiveAction label="Accéder aux supports de cours" href="/compte/apprenant/supports-de-cours" />
          <RendreExerciceAction />
          <LiveAction label="Calendrier des classes virtuelles" href="/compte/apprenant/calendrier" />
          <LiveAction label="Accéder au Forum" href="/forum" />
          <LiveAction label="Ma carrière : offres d'emploi" href="/offres/carrieres" />
          <PlaceholderAction label="Contacter le formateur" />
        </div>
      </div>
    </Reveal>
  );
}
