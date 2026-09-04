import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Hero from "@/components/examens/Hero";
import DiplomaCard, { type ProgramDetails } from "@/components/examens/DiplomaCard";
import DfpOverviewCard from "@/components/examens/DfpOverviewCard";
import CtaBlock from "@/components/examens/CtaBlock";

export const metadata: Metadata = {
  title: "Se préparer aux examens — e-Staf",
  description:
    "Préparations officielles DELF/DALF, TEF Canada/TCF et DFP (Diplômes de Français Professionnel) : décrochez votre certification internationale avec e-Staf.",
};

// Créneaux et rythme communs aux 3 offres (seuls la durée, le tarif et la
// prochaine vague changent d'une offre à l'autre) — voir discussion RH du
// 2026-09-04.
const COMMON_TIME_SLOTS = ["6h", "7h", "8h", "9h", "10h", "19h", "20h", "21h"];
const COMMON_FREQUENCY = "1h par jour";
const COMMON_GROUP_SIZE = 5;

const DELF_DALF_DETAILS: ProgramDetails = {
  groupSize: COMMON_GROUP_SIZE,
  nextCohort: "26 septembre 2026",
  frequency: COMMON_FREQUENCY,
  duration: "5 semaines",
  timeSlots: COMMON_TIME_SLOTS,
  price: "50 €",
};

const TEF_CANADA_DETAILS: ProgramDetails = {
  groupSize: COMMON_GROUP_SIZE,
  // Pas de date de prochaine vague fixe pour l'instant — inscriptions en
  // continu (voir statusDetail "Boost spécial immigration" ci-dessous).
  frequency: COMMON_FREQUENCY,
  duration: "6 semaines",
  timeSlots: COMMON_TIME_SLOTS,
  price: "120 €",
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
    nextCohort: "10 septembre 2026",
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
    nextCohort: "1er octobre 2026",
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
    nextCohort: "15 septembre 2026",
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
    nextCohort: "1er octobre 2026",
  },
].map((program) => ({
  ...program,
  details: {
    groupSize: COMMON_GROUP_SIZE,
    nextCohort: program.nextCohort,
    frequency: COMMON_FREQUENCY,
    duration: "6 semaines",
    timeSlots: COMMON_TIME_SLOTS,
    price: "100 €",
  } satisfies ProgramDetails,
}));

export default function ExamensPage() {
  return (
    <div className="min-h-screen bg-obsidian">
      <Hero />

      <div className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          {/* Section title */}
          <Reveal delay={80}>
            <h2 className="text-center font-display text-3xl font-bold text-accent sm:text-4xl">
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
                details={DELF_DALF_DETAILS}
                typeFormationValue="delf-dalf"
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
                details={TEF_CANADA_DETAILS}
                typeFormationValue="tef-canada"
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
              <h2 className="text-center font-display text-2xl font-bold text-accent sm:text-3xl">
                Préparations aux DFP (Diplômes de Français Professionnel)
              </h2>
              <p className="mx-auto mt-4 max-w-3xl text-center font-sans text-sm text-white/70 sm:text-base">
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
                    details={program.details}
                    typeFormationValue={program.segment}
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
    </div>
  );
}
