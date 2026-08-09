import Reveal from "@/components/Reveal";

const DOUBTS = [
  "« Nos collaborateurs resteront-ils chez nous après avoir été formés ? »",
  "« Les former ne revient-il pas à sacrifier un temps précieux de productivité ? »",
  "« Comment être sûr que la formation n'est pas que théorique ? »",
];

// Ouverture de la page "Former son équipe" — même univers dark/elite que
// /entreprises et /offres/fol (eyebrow + h1 en italique), avec les 3 doutes
// du dirigeant listés tels quels pour que la suite (Promesses) y réponde
// point par point.
export default function Hero() {
  return (
    <section className="bg-obsidian px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Espace Entreprises (B2B) — Former son équipe
          </p>
        </Reveal>

        <Reveal delay={100}>
          <h1 className="mt-6 font-display text-3xl font-semibold italic leading-tight text-white sm:text-4xl md:text-5xl">
            Former son équipe sans sacrifier son temps de productivité&nbsp;:{" "}
            <span className="text-accent">le dilemme du Dirigeant</span>
          </h1>
        </Reveal>

        <Reveal delay={200}>
          <p className="mx-auto mt-6 max-w-2xl font-sans text-base text-white/80 sm:text-lg">
            La plus grande force d&apos;une entreprise, c&apos;est la performance de son équipe et
            la reconnaissance de ses clients. Former son équipe, c&apos;est investir sur le long
            terme pour fidéliser sa clientèle.
          </p>
        </Reveal>

        <Reveal delay={300}>
          <div className="mx-auto mt-10 max-w-xl space-y-3 text-left">
            <p className="text-center font-mono text-xs uppercase tracking-widest text-white/40">
              Vos doutes ?
            </p>
            {DOUBTS.map((doubt) => (
              <p
                key={doubt}
                className="rounded border border-white/10 bg-obsidianCard px-5 py-3 font-sans text-sm text-white/70"
              >
                <span className="mr-2 text-accent">❓</span>
                {doubt}
              </p>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
