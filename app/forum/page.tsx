import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import LiveSection from "@/components/forum/LiveSection";
import ForumAccessGate from "@/components/forum/ForumAccessGate";

export const metadata: Metadata = {
  title: "Forum — e-Staf",
  description:
    "Chaque mois, un client e-Staf prend la parole en direct pour partager son expérience et son domaine d'activité.",
  robots: { index: false, follow: false },
};

// /forum — distinct from /communaute (client's instruction, 2026-08-04):
// Communauté showcases e-Staf's own performance (best agents, highlights).
// Forum is where e-Staf's clients speak in their own words — social proof
// that talents find credible, which internal self-promotion can't provide.
// Masqué au public depuis le 2026-09-05, voir ForumAccessGate.
export default function ForumPage() {
  return (
    <ForumAccessGate>
      <div className="bg-obsidian">
        <section className="px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <p className="font-mono text-xs uppercase tracking-widest text-accent">
                Forum e-Staf
              </p>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
                La parole à nos clients
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mx-auto mt-5 max-w-2xl font-sans text-base text-white/60 sm:text-lg">
                Ici, ce ne sont pas nos performances que l&apos;on met en
                avant, mais celles de nos clients. Un rendez-vous mensuel en
                direct pour que nos talents entendent, sans filtre, ce que
                vivre une collaboration avec e-Staf veut vraiment dire.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="border-t border-accent/15 px-4 pb-20 pt-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <LiveSection />
          </div>
        </section>
      </div>
    </ForumAccessGate>
  );
}
