import Reveal from "@/components/Reveal";
import PromiseCard from "@/components/entreprises/PromiseCard";
import {
  ShieldIcon,
  GaugeIcon,
  LayeredSquaresIcon,
  LockIcon,
  BarChartIcon,
  RefreshLoopIcon,
} from "@/components/entreprises/PromiseIcons";

const PROMISES = [
  {
    icon: <ShieldIcon className="h-full w-full" />,
    title: "Des Locaux Équipés & Sécurisés",
    description:
      "Une infrastructure professionnelle prête à l'emploi sur nos pôles pour garantir une continuité de service irréprochable, sans coupure ni risque technique.",
  },
  {
    icon: <GaugeIcon className="h-full w-full" />,
    title: "Un Encadrement Managérial Rigoureux",
    description:
      "Un pilotage constant sur le terrain pour suivre les indicateurs, optimiser la cadence et s'assurer que chaque objectif de performance est atteint.",
  },
  {
    icon: <LayeredSquaresIcon className="h-full w-full" />,
    title: "Maîtrise des Outils & CRM",
    description:
      "Intégration et maîtrise parfaite de vos logiciels et outils métiers pour une immersion immédiate dans vos écosystèmes.",
  },
  {
    icon: <LockIcon className="h-full w-full" />,
    title: "Transparence & Confidentialité Tarifaire",
    description:
      "Les grilles tarifaires et conditions financières ne sont pas étalées en vitrine. Elles sont communiquées et détaillées dans le contrat officiel, transmis exclusivement à vous.",
  },
  {
    icon: <BarChartIcon className="h-full w-full" />,
    title: "Pilotage & Reporting Hebdomadaire",
    description:
      "Point de contact direct d'une heure chaque semaine entre nos managers et vos équipes, appuyé par un reporting graphique et statistique complet (progression sur la prod, atteinte des objectifs, constats, analyses et axes d'amélioration).",
  },
  {
    icon: <RefreshLoopIcon className="h-full w-full" />,
    title: "Zéro Turnover / Remplacement Garanti",
    description:
      "Zéro compromis sur la stabilité. Nous garantissons une continuité absolue et, au pire, nous disposons des ressources et de la réactivité immédiate pour remplacer un profil sans impacter votre production.",
  },
];

// The one navy full-bleed band on this otherwise light-universe page — used
// here for rhythm/contrast around the six core B2B promises.
export default function PromisesSection() {
  return (
    <section className="bg-primary px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              Nos engagements
            </p>
            <h2 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              Les Promesses d&apos;e-Staf &amp; Standards de Performance
            </h2>
            <p className="mt-3 font-sans text-base text-white/70">
              Ce que nous mettons en place pour sécuriser vos projets et
              exiger l&apos;excellence au quotidien.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PROMISES.map((promise) => (
              <PromiseCard key={promise.title} {...promise} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
