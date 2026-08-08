import Reveal from "@/components/Reveal";
import PromiseCard from "@/components/entreprises/PromiseCard";

const TOP_PROMISES = [
  {
    emoji: "⏱️",
    title: "Format 1h30 / jour par roulement",
    description: "0 % d'interruption de votre chaîne de production ou de votre service client.",
  },
  {
    emoji: "👥",
    title: "Groupes à taille humaine (Max 15 pers.)",
    description: "Prise de parole maximale et coaching individuel intensif.",
  },
  {
    emoji: "🛡️",
    title: "Zéro charge mentale & Zéro logiciel à gérer",
    description:
      "L'équipe e-Staf pilote 100 % des analyses et vous livre vos synthèses RH clés en main.",
  },
];

const DELIVERABLES = [
  {
    emoji: "🎯",
    title: "La Jauge de Niveau Global",
    description:
      "Visualisez instantanément la répartition de vos équipes et le pourcentage exact d'agents atteignant le niveau ciblé (ex : validation C1).",
  },
  {
    emoji: "📈",
    title: "La Courbe d'Évolution Statistique Individuelle",
    description:
      "Le suivi séance par séance pour chaque apprenant afin de mesurer sa progression exacte et son engagement.",
  },
  {
    emoji: "📊",
    title: "L'Analyse Minutieuse par Compétence",
    description:
      "Un suivi sur-mesure ajusté à votre secteur (aisance orale, gestion de conflit, rigueur rédactionnelle, posture, clarté et synthèse).",
  },
];

// Réponse directe aux 3 doutes du Hero — les promesses e-Staf, dans le même
// habillage que PromisesSection.tsx (/entreprises), en réutilisant PromiseCard
// telle quelle (icon/title/description génériques) avec des emoji en guise
// d'icônes plutôt que de nouvelles icônes SVG, pour une page à contenu déjà
// très dense.
export default function Promises() {
  return (
    <section className="bg-obsidian px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              Nos engagements
            </p>
            <h2 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              Les Promesses d&apos;e-Staf
            </h2>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {TOP_PROMISES.map((p) => (
              <PromiseCard
                key={p.title}
                icon={<span className="text-2xl leading-none">{p.emoji}</span>}
                title={p.title}
                description={p.description}
              />
            ))}
          </div>
        </Reveal>

        <Reveal delay={180}>
          <div className="mt-6 rounded border border-accent/30 bg-obsidianCard p-6 sm:p-8">
            <p className="font-display text-base font-bold text-white">
              Vos synthèses RH clés en main
            </p>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {DELIVERABLES.map((d) => (
                <div key={d.title} className="flex flex-col gap-2">
                  <span className="text-xl leading-none">{d.emoji}</span>
                  <h3 className="font-display text-sm font-bold leading-snug text-white">
                    {d.title}
                  </h3>
                  <p className="font-sans text-sm leading-relaxed text-white/70">
                    {d.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={220}>
          <div className="mt-6 flex flex-col items-center gap-3 rounded border border-white/10 bg-obsidianCard p-6 text-center sm:flex-row sm:justify-center sm:text-left">
            <span className="text-2xl leading-none">📋</span>
            <p className="font-sans text-sm text-white/80">
              <strong className="font-semibold text-white">Bilan RH Clés en Main :</strong> un
              rapport complet comprenant le constat de progression, l&apos;analyse des écarts et
              des axes d&apos;amélioration sur-mesure.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
