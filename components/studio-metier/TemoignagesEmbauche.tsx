import Reveal from "@/components/Reveal";
import ReactionButton from "@/components/communaute/ReactionButton";
import AuthGate from "@/components/communaute/AuthGate";
import { LockIcon, StarIcon } from "@/components/communaute/CommunityIcons";

interface TemoignageEmbauche {
  id: string;
  firstname: string;
  /** Poste obtenu grâce à e-Staf. */
  poste: string;
  /** Délai entre la candidature et l'embauche, ex. "3 semaines". */
  delai: string;
  quote: string;
  reactions: number;
  rating: number;
}

// EXEMPLES uniquement — à remplacer par de vrais témoignages de personnes
// embauchées, validés par l'administration (demande cliente du 2026-09-26 :
// sur « Ma carrière », les avis portent sur l'emploi trouvé, pas sur les
// cours).
const EXEMPLES: TemoignageEmbauche[] = [
  {
    id: "e1",
    firstname: "Fara",
    poste: "Téléconseillère — marché canadien",
    delai: "3 semaines",
    quote:
      "Après le test C1 et la formation, j'ai signé mon contrat en trois semaines. Je travaille aujourd'hui pour un grand compte au Canada.",
    reactions: 14,
    rating: 5,
  },
  {
    id: "e2",
    firstname: "Njaka",
    poste: "Closer",
    delai: "1 mois",
    quote:
      "On m'a accompagné jusqu'à l'entretien final. Mon niveau de français n'est plus un frein : c'est devenu mon atout.",
    reactions: 11,
    rating: 5,
  },
  {
    id: "e3",
    firstname: "Tiana",
    poste: "Agent Support Émailing",
    delai: "5 semaines",
    quote:
      "J'avais peur d'échouer au test. L'équipe m'a remise à niveau, et j'ai décroché un poste en télétravail à temps plein.",
    reactions: 8,
    rating: 4,
  },
];

function InitialAvatar({ firstname }: { firstname: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/50 bg-obsidian font-display text-sm font-semibold text-accent"
    >
      {firstname.charAt(0)}
    </span>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} étoiles sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          filled={i < rating}
          className={`h-3.5 w-3.5 ${i < rating ? "text-accent" : "text-white/20"}`}
        />
      ))}
    </div>
  );
}

// Colonne « Ils ont trouvé leur emploi » de « Ma carrière » — même
// présentation que l'Espace Avis de la Communauté (components/communaute/
// TestimonialsSection.tsx), mise en pause le temps d'avoir plus de volume.
export default function TemoignagesEmbauche() {
  return (
    <div id="reussites" aria-labelledby="ils-ont-trouve" className="scroll-mt-24">
      <Reveal>
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 id="ils-ont-trouve" className="font-display text-2xl font-bold text-accent sm:text-3xl">
            Ils ont trouvé leur emploi
          </h2>
          <span className="font-mono text-xs uppercase tracking-widest text-white/40">(Vérifié)</span>
        </div>
        <p className="mt-2 font-sans text-sm text-white/60">
          Ils ont passé le test, suivi le parcours e-Staf et décroché leur poste. Voici leur histoire.
        </p>
      </Reveal>

      <Reveal delay={60}>
        <div className="mt-5 flex items-center gap-2 rounded border border-accent/25 bg-obsidianCard px-4 py-3 font-sans text-xs text-white/60">
          <LockIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
          Chaque témoignage est vérifié par l&apos;administration avant publication.
        </div>
      </Reveal>

      <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-white/40">
        Exemples illustratifs — à remplacer par de vrais témoignages
      </p>

      <div className="mt-3 space-y-4">
        {EXEMPLES.map((t, i) => (
          <Reveal key={t.id} delay={i * 60}>
            <article className="flex gap-3 rounded border border-accent/25 bg-obsidianCard p-4">
              <InitialAvatar firstname={t.firstname} />
              <div className="min-w-0 flex-1">
                <p className="font-sans text-sm font-medium text-white">{t.firstname}</p>
                <div className="mt-1">
                  <StarRow rating={t.rating} />
                </div>
                <p className="mt-2 font-sans text-sm italic text-white/70">&laquo; {t.quote} &raquo;</p>
                <p className="mt-3 font-sans text-xs text-accent">{t.poste}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="font-mono text-xs text-white/40">Embauché(e) en {t.delai}</p>
                  <ReactionButton initialCount={t.reactions} label={`Réagir au témoignage de ${t.firstname}`} />
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal delay={120}>
        <div className="mt-10">
          <p className="font-sans text-sm font-medium text-accent">Vous avez été embauché(e) grâce à e-Staf ?</p>
          <AuthGate
            message="Connectez-vous pour partager votre parcours. Chaque témoignage est vérifié par l'administration avant publication."
            className="mt-3"
          />
        </div>
      </Reveal>
    </div>
  );
}
