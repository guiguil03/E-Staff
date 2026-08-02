import Link from "next/link";
import Reveal from "@/components/Reveal";
import ReactionButton from "./ReactionButton";
import AuthGate from "./AuthGate";
import { LockIcon, StarIcon } from "./CommunityIcons";

interface Testimonial {
  id: string;
  firstname: string;
  role: string;
  quote: string;
  reactions: number;
  rating: number;
}

// EXAMPLE approved testimonials only — stand-ins for content that would, in
// production, come from the moderation back-office once real accounts and a
// database exist.
const EXAMPLE_TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    firstname: "Fara",
    role: "Apprenante",
    quote:
      "Le programme d'excellence orale m'a permis de gagner en assurance à l'oral, jusqu'au niveau C1.",
    reactions: 12,
    rating: 5,
  },
  {
    id: "t2",
    firstname: "Njaka",
    role: "Agent",
    quote:
      "Le suivi quotidien des performances m'a aidé à progresser vite dans mes missions.",
    reactions: 9,
    rating: 5,
  },
  {
    id: "t3",
    firstname: "Tiana",
    role: "Partenaire",
    quote:
      "La transparence sur le suivi des candidats recommandés change tout dans une collaboration B2B.",
    reactions: 7,
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

// The "Espace Avis & Témoignages" sidebar for /communaute — dark/elite
// universe. Returns content only; the page shell supplies the full-bleed
// obsidian background and the two-column grid it sits inside.
export default function TestimonialsSection() {
  return (
    <div aria-labelledby="espace-avis">
      <Reveal>
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 id="espace-avis" className="font-display text-2xl font-bold text-accent sm:text-3xl">
            L&apos;Espace Avis &amp; Témoignages
          </h2>
          <span className="font-mono text-xs uppercase tracking-widest text-white/40">
            (Modéré)
          </span>
        </div>
        <p className="mt-2 font-sans text-sm text-white/60">
          Votre voix compte. Exprimez-vous en toute transparence sur votre expérience e-Staf.
        </p>
      </Reveal>

      <Reveal delay={60}>
        <div className="mt-5 flex items-center gap-2 rounded border border-accent/25 bg-obsidianCard px-4 py-3 font-sans text-xs text-white/60">
          <LockIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
          Vos avis sont les bienvenus et seront publiés après validation administrative.
        </div>
      </Reveal>

      <Reveal delay={90}>
        <Link
          href="/connexion"
          className="mt-5 inline-flex items-center justify-center rounded-full border border-accent bg-accent px-6 py-2.5 font-sans text-sm font-medium text-obsidian transition-colors duration-150 hover:bg-accent/90"
        >
          Soumettre mon avis
        </Link>
      </Reveal>

      <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-white/40">
        Exemples d&apos;avis déjà validés
      </p>

      <div className="mt-3 space-y-4">
        {EXAMPLE_TESTIMONIALS.map((t, i) => (
          <Reveal key={t.id} delay={i * 60}>
            <article className="flex gap-3 rounded border border-accent/25 bg-obsidianCard p-4">
              <InitialAvatar firstname={t.firstname} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-sans text-sm font-medium text-white">{t.firstname}</p>
                </div>
                <div className="mt-1">
                  <StarRow rating={t.rating} />
                </div>
                <p className="mt-2 font-sans text-sm italic text-white/70">
                  &laquo; {t.quote} &raquo;
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="font-mono text-xs text-white/40">{t.role}</p>
                  <ReactionButton
                    initialCount={t.reactions}
                    label={`Réagir au témoignage de ${t.firstname}`}
                  />
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal delay={120}>
        <div className="mt-10">
          <p className="font-sans text-sm font-medium text-accent">Partager votre avis</p>
          <AuthGate
            message="Connectez-vous pour laisser un avis. Chaque témoignage est vérifié par l'administration avant publication publique."
            className="mt-3"
          />
        </div>
      </Reveal>
    </div>
  );
}
