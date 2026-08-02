import Reveal from "@/components/Reveal";
import ReactionButton from "./ReactionButton";
import AuthGate from "./AuthGate";

interface Testimonial {
  id: string;
  firstname: string;
  role: string;
  quote: string;
  reactions: number;
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
  },
  {
    id: "t2",
    firstname: "Njaka",
    role: "Agent",
    quote:
      "Le suivi quotidien des performances m'a aidé à progresser vite dans mes missions.",
    reactions: 9,
  },
  {
    id: "t3",
    firstname: "Tiana",
    role: "Partenaire",
    quote:
      "La transparence sur le suivi des candidats recommandés change tout dans une collaboration B2B.",
    reactions: 7,
  },
];

export default function TestimonialsSection() {
  return (
    <section
      className="border-t border-primary/10 bg-white px-4 py-16 sm:px-6 sm:py-20"
      aria-labelledby="espace-avis"
    >
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <h2
            id="espace-avis"
            className="font-display text-2xl font-bold text-primary sm:text-3xl"
          >
            L&apos;Espace Avis &amp; Témoignages
          </h2>
          <p className="mt-2 font-sans text-sm text-muted">
            Votre voix compte. Exprimez-vous en toute transparence sur votre expérience e-Staf.
          </p>
        </Reveal>

        <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-muted">
          Exemples d&apos;avis déjà validés
        </p>

        <div className="mt-3 space-y-4">
          {EXAMPLE_TESTIMONIALS.map((t, i) => (
            <Reveal key={t.id} delay={i * 60}>
              <article className="rounded border border-primary/10 bg-background p-5">
                <p className="font-sans text-sm italic text-ink">&laquo; {t.quote} &raquo;</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="font-mono text-xs text-muted">
                    {t.firstname} — {t.role}
                  </p>
                  <ReactionButton
                    initialCount={t.reactions}
                    label={`Réagir au témoignage de ${t.firstname}`}
                  />
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mt-10">
            <p className="font-sans text-sm font-medium text-primary">Partager votre avis</p>
            <AuthGate
              message="Connectez-vous pour laisser un avis. Chaque témoignage est vérifié par l'administration avant publication publique."
              className="mt-3"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
