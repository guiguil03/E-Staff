import Reveal from "@/components/Reveal";

// Closing editorial line — full-bleed dark, gold rule, large serif quote.
export default function ClosingSection() {
  return (
    <section className="bg-obsidian px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <div className="mx-auto mb-8 h-px w-16 bg-accent" />
          <p className="font-display text-xl italic leading-relaxed text-white sm:text-2xl">
            Ici, nous ne vous apprenons pas seulement à parler français : nous
            sculptons votre autorité naturelle.{" "}
            <span className="text-accent">
              Votre voix est votre premier outil de conquête.
            </span>{" "}
            Ne la subissez plus : incarnez-la.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
