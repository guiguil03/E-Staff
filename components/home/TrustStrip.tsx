import Reveal from "@/components/Reveal";

const TAGS = [
  "Sélection sur test réel",
  "Infrastructure sécurisée 24/7",
  "Niveau C1 certifié",
  "Reporting hebdomadaire",
];

export default function TrustStrip() {
  return (
    <section className="border-t border-primary/10 bg-white px-4 py-10 sm:px-6">
      <Reveal>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {TAGS.map((tag) => (
            <span
              key={tag}
              className="font-mono text-xs uppercase tracking-widest text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
