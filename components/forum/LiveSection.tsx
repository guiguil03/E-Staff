import Reveal from "@/components/Reveal";
import AuthGate from "@/components/communaute/AuthGate";
import { CommentIcon, LockIcon } from "@/components/communaute/CommunityIcons";

// MVP volontairement simple (client's instruction, 2026-08-04 : "fais un
// truc simple on étoffera après") — pas de vraie intégration de live pour
// l'instant, juste la structure et le concept. À enrichir plus tard :
// embed YouTube/Facebook Live, calendrier des prochains invités, back-office
// de modération des commentaires.
export default function LiveSection() {
  return (
    <div aria-labelledby="forum-live">
      <Reveal>
        <h2 id="forum-live" className="font-display text-2xl font-bold text-accent sm:text-3xl">
          Le Live du mois
        </h2>
        <p className="mt-2 max-w-2xl font-sans text-sm text-white/60">
          Chaque mois, un client e-Staf prend la parole en direct pour
          partager son expérience et son domaine d&apos;activité.
        </p>
      </Reveal>

      <Reveal delay={80}>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded border border-dashed border-accent/30 bg-obsidianCard px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold text-white">
            Aucun live programmé pour le moment
          </p>
          <p className="max-w-sm font-sans text-sm text-white/60">
            Le premier Forum e-Staf est en préparation. Revenez bientôt pour
            découvrir la date et l&apos;invité du mois.
          </p>
        </div>
      </Reveal>

      <Reveal delay={140}>
        <div className="mt-8">
          <div className="flex items-center gap-2 font-sans text-sm font-medium text-accent">
            <CommentIcon className="h-4 w-4" />
            Commentaires du live
          </div>
          <div className="mt-3 flex items-center gap-2 rounded border border-accent/25 bg-obsidianCard px-4 py-3 font-sans text-xs text-white/60">
            <LockIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
            Les commentaires s&apos;ouvrent pendant la diffusion du live.
          </div>
          <AuthGate
            message="Connectez-vous pour rejoindre le live et échanger en direct avec nos clients."
            className="mt-3"
          />
        </div>
      </Reveal>
    </div>
  );
}
