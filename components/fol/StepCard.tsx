interface StepCardProps {
  number: string;
  title: string;
  description: string;
}

// A single numbered step in "Le Parcours du Combattant" — gold-bordered
// card with a large gold number, used in a single row on desktop and
// stacked on mobile.
export default function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="flex flex-1 flex-col rounded border border-accent/40 bg-obsidianCard p-6 sm:p-7">
      <span className="font-display text-4xl font-bold text-accent">{number}</span>
      <h3 className="mt-4 font-display text-lg font-bold uppercase leading-snug text-white">
        {title}
      </h3>
      <p className="mt-3 font-sans text-sm leading-relaxed text-white/60">
        {description}
      </p>
    </div>
  );
}
