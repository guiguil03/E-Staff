import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import DiplomaCard from "@/components/examens/DiplomaCard";
import DfpOverviewCard from "@/components/examens/DfpOverviewCard";
import CtaBlock from "@/components/examens/CtaBlock";

export const metadata: Metadata = {
  title: "Se préparer aux examens — e-Staf",
  description:
    "Préparations officielles DELF/DALF, TEF Canada/TCF et DFP (Diplômes de Français Professionnel) : décrochez votre certification internationale avec e-Staf.",
};

const DFP_PROGRAMS = [
  {
    id: "dfp-affaires",
    badgeLines: ["DFP"],
    title: "DFP Affaires",
    subtitle: "Le Standard des Dirigeants & Commerciaux",
    cibles: "Commerciaux, managers, entrepreneurs et cadres d'entreprise.",
    mission:
      "Validez la capacité à négocier, rédiger des contrats, animer des réunions, gérer la relation client et piloter la stratégie d'une structure en français.",
    statusLabel: "PROCHAINE COHORTE FIXÉE AU 10 SEPTEMBRE 2026",
    statusDetail: "(Inscriptions ouvertes pour bloquer la date)",
    segment: "dfp-affaires",
    actions: [
      { label: "S'inscrire pour le 10 Septembre", ctaLabel: "S'inscrire pour le 10 Septembre" },
      { label: "Réserver ma Place", ctaLabel: "Réserver ma Place" },
    ] as [{ label: string; ctaLabel: string }, { label: string; ctaLabel: string }],
  },
  {
    id: "dfp-ri",
    badgeLines: ["DFP"],
    title: "DFP Relations Internationales",
    subtitle: "Diplomatie & Géopolitique",
    cibles:
      "Diplomates, fonctionnaires internationaux, ONG, cadres d'organisations internationales et juristes.",
    mission:
      "Maîtrisez le langage diplomatique, la rédaction de notes de synthèse, les comptes-rendus officiels et la négociation bilatérale ou multilatérale.",
    statusLabel: "PROCHAINE COHORTE FIXÉE AU 1ER OCTOBRE 2026",
    segment: "dfp-ri",
    actions: [
      { label: "S'inscrire pour le 1er Octobre", ctaLabel: "S'inscrire pour le 1er Octobre" },
      { label: "Réserver ma Place", ctaLabel: "Réserver ma Place" },
    ] as [{ label: string; ctaLabel: string }, { label: string; ctaLabel: string }],
  },
  {
    id: "dfp-tourisme",
    badgeLines: ["DFP"],
    title: "DFP Tourisme, Hôtellerie & Restauration",
    subtitle: "L'Excellence de l'Accueil",
    cibles:
      "Professionnels du tourisme, managers d'hôtels, restaurateurs et acteurs de l'industrie hôtelière haut de gamme.",
    mission:
      "Gérez la clientèle exigeante, résolvez les litiges, commercialisez des prestations touristiques et pilotez l'accueil avec un raffinement irréprochable.",
    statusLabel: "PROCHAINE COHORTE FIXÉE AU 15 SEPTEMBRE 2026",
    segment: "dfp-tourisme",
    actions: [
      { label: "S'inscrire pour le 15 Septembre", ctaLabel: "S'inscrire pour le 15 Septembre" },
      { label: "Réserver ma Place", ctaLabel: "Réserver ma Place" },
    ] as [{ label: string; ctaLabel: string }, { label: string; ctaLabel: string }],
  },
  {
    id: "dfp-sante",
    badgeLines: ["DFP"],
    title: "DFP Santé",
    subtitle: "Le Professionnalisme Médical",
    cibles:
      "Médecins, infirmiers, chercheurs et personnel de santé évoluant dans un environnement francophone.",
    mission:
      "Maîtrisez le lexique médical, rédigez des dossiers patients, communiquez avec les confrères et interagissez avec rigueur auprès des patients.",
    statusLabel: "PROCHAINE COHORTE FIXÉE AU 1ER OCTOBRE 2026",
    segment: "dfp-sante",
    actions: [
      { label: "S'inscrire pour le 1er Octobre", ctaLabel: "S'inscrire pour le 1er Octobre" },
      { label: "Réserver ma Place", ctaLabel: "Réserver ma Place" },
    ] as [{ label: string; ctaLabel: string }, { label: string; ctaLabel: string }],
  },
];

export default function ExamensPage() {
  return (
    <div className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        {/* Intro */}
        <Reveal>
          <p className="mx-auto max-w-3xl text-center font-sans text-base leading-relaxed text-ink sm:text-lg">
            Un diplôme officiel ne se contente pas de valider des compétences :
            il ouvre des frontières, crédibilise un parcours et propulse une
            carrière. Chez e-Staf, nous ne vous préparons pas seulement à
            réussir un examen ; nous vous armons pour exceller. Choisissez
            votre certification, franchissez le cap et laissez votre talent
            s&apos;exprimer sans limites.
          </p>
        </Reveal>

        {/* Section title */}
        <Reveal delay={80}>
          <h2 className="mt-14 text-center font-display text-3xl font-bold text-primary sm:text-4xl">
            Nos Parcours de Préparation Officiels
          </h2>
        </Reveal>

        {/* 3-card row: DELF/DALF, TEF Canada, DFP overview */}
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Reveal delay={100}>
            <DiplomaCard
              badgeLines={["DELF", "DALF"]}
              title="Le Programme Intensif « DELF / DALF »"
              subtitle="Le Sceau de l'Excellence"
              mission="Maîtrisez les codes, la structure des épreuves et l'art de rédiger ou de plaider pour décrocher haut la main votre diplôme officiel de français (niveaux B1, B2, C1, C2)."
              statusLabel="PRÉPARATIONS OUVERTES"
              statusDetail="(Sessions en continu / Passage des examens planifié)"
              statusTone="success"
              segment="delf-dalf"
              actions={[
                {
                  label: "S'inscrire à la Préparation DELF/DALF",
                  ctaLabel: "S'inscrire à la Préparation DELF/DALF",
                },
                {
                  label: "Réserver mon Évaluation Initiale",
                  ctaLabel: "Réserver mon Évaluation Initiale",
                },
              ]}
              className="h-full"
            />
          </Reveal>

          <Reveal delay={160}>
            <DiplomaCard
              badgeLines={["TEF", "TCF"]}
              title="Le Programme « TEF Canada / TCF »"
              subtitle="Le Sésame de l'Immigration & Carrière"
              mission="Chaque point compte pour votre projet d'immigration ou d'expatriation. Un entraînement chirurgical aux épreuves chronométrées pour maximiser votre score et décrocher les niveaux requis (CLB 7, 8, 9+)."
              statusLabel="PRÉPARATIONS OUVERTES"
              statusDetail="(Boost spécial immigration)"
              statusTone="success"
              segment="tef-canada"
              actions={[
                { label: "Maximiser mon Score TEF/TCF", ctaLabel: "Maximiser mon Score TEF/TCF" },
                {
                  label: "Réserver ma Session d'Entraînement",
                  ctaLabel: "Réserver ma Session d'Entraînement",
                },
              ]}
              className="h-full"
            />
          </Reveal>

          <Reveal delay={220}>
            <DfpOverviewCard targetId="dfp-programmes" className="h-full" />
          </Reveal>
        </div>

        {/* DFP subsection — 4 distinct dated cohorts, detailed below the overview card */}
        <div id="dfp-programmes" className="mt-20 scroll-mt-6">
          <Reveal>
            <h2 className="text-center font-display text-2xl font-bold text-primary sm:text-3xl">
              Préparations aux DFP (Diplômes de Français Professionnel)
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-center font-sans text-sm text-muted sm:text-base">
              Ne dites plus simplement que vous parlez français : prouvez que
              vous dominez les rouages, le jargon et les codes de votre
              secteur d&apos;activité au niveau international.
            </p>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {DFP_PROGRAMS.map((program, index) => (
              <Reveal key={program.id} delay={index * 60}>
                <DiplomaCard
                  id={program.id}
                  badgeLines={program.badgeLines}
                  title={program.title}
                  subtitle={program.subtitle}
                  cibles={program.cibles}
                  mission={program.mission}
                  statusLabel={program.statusLabel}
                  statusDetail={program.statusDetail}
                  statusTone="accent"
                  segment={program.segment}
                  actions={program.actions}
                  className="h-full"
                />
              </Reveal>
            ))}
          </div>
        </div>

        {/* Bottom framed CTA */}
        <Reveal delay={100}>
          <div className="mt-20">
            <CtaBlock />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
