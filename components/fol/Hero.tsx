import Reveal from "@/components/Reveal";

// Opening pitch — sets the "dark premium/elite" tone for the whole page.
export default function Hero() {
  return (
    <section className="bg-obsidian px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <p className="font-mono text-xs tracking-[0.2em] text-white/40">
            01 / PROGRAMME D&apos;ÉLITE
          </p>
          <h1 className="mt-4 font-display text-3xl font-bold uppercase leading-tight tracking-wide text-accent sm:text-4xl md:text-5xl">
            Catalogue d&apos;élite : les programmes qui tranchent
          </h1>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-8 space-y-4 font-sans text-base leading-relaxed text-white/60 sm:text-lg">
            <p>
              Les diplômes ne remplissent pas les comptes en banque. Ne suivez pas la
              masse. Prenez l&apos;avantage.
            </p>
            <p>
              Chez e-Staf, on adopte la règle du{" "}
              <strong className="font-semibold tracking-wide text-accent">
                QUE LES MEILLEURS GAGNENT
              </strong>
              .
            </p>
          </div>
        </Reveal>

        <Reveal delay={180}>
          <div className="mt-10 border-t border-accent/40 pt-8">
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
              Le Programme Phare —{" "}
              <span className="text-accent">FOL (Français Oratoire des Leaders)</span>
            </h2>
            <p className="mt-4 font-sans text-base leading-relaxed text-white/70 sm:text-lg">
              Vous avez déjà perdu des contrats ; non pas à cause de votre technique,
              mais de votre impact ; changez de dimension. Devenez celui qu&apos;on
              écoute, qu&apos;on respecte et qu&apos;on suit les yeux fermés.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
