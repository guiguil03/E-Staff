import Reveal from "@/components/Reveal";

interface ComingSoonPanelProps {
  title: string;
  items: string[];
}

// Placeholder honnête pour les sections du Portail RH pas encore
// développées (contrats cadres, facturation, paie/commissions...) — même
// principe que les Blocs 2/5 "Bientôt disponible" de l'évaluation candidat
// ou le Forum avant son premier live : montrer la feuille de route plutôt
// que de cacher ce qui manque, jamais de données inventées à la place.
export default function ComingSoonPanel({ title, items }: ComingSoonPanelProps) {
  return (
    <Reveal>
      <div className="rounded border border-dashed border-white/15 bg-obsidianCard p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Bientôt disponible
        </p>
        <h3 className="mt-2 font-display text-base font-semibold text-white">{title}</h3>
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2 font-sans text-sm text-white/60">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent/60" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}
