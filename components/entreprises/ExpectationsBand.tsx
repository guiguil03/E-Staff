import Reveal from "@/components/Reveal";

const EXPECTATIONS = [
  {
    title: "Vos Outils & CRM",
    description:
      "Vous mettez à notre disposition vos logiciels métiers et votre CRM pour que nos équipes s'immergent directement dans votre écosystème.",
  },
  {
    title: "Une Formation Métier (5 Jours)",
    description:
      "Vos équipes dispensent une formation initiale de 5 jours dédiée à vos spécificités, vos produits et vos process pour calibrer nos profils avant le premier appel.",
  },
];

// Visually distinct, accent-tinted strip — this is what e-Staf expects back
// from the client, sitting between the promises band and the collaboration
// options.
export default function ExpectationsBand() {
  return (
    <section className="border-y border-accent/20 bg-accent/10 px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-primary/60">
            Réciprocité
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold text-primary sm:text-3xl">
            Ce que e-Staf attend de vous
          </h2>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {EXPECTATIONS.map((item) => (
              <div
                key={item.title}
                className="rounded border border-accent/30 bg-white p-6"
              >
                <h3 className="font-display text-lg font-bold text-primary">
                  {item.title}
                </h3>
                <p className="mt-2 font-sans text-sm text-ink">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
