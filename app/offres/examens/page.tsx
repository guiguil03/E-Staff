import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Hero from "@/components/examens/Hero";
import DiplomaCard from "@/components/examens/DiplomaCard";
import DfpOverviewCard from "@/components/examens/DfpOverviewCard";
import CtaBlock from "@/components/examens/CtaBlock";
import type { ProgrammeDetails } from "@/components/examens/FormationDetailsModal";

const CRENEAUX_STANDARD = ["6h", "7h", "8h", "9h", "10h", "19h", "20h", "21h"];

const DELF_DALF_DETAILS: ProgrammeDetails = {
  format: "Groupe de 5 apprenants",
  prochaineVague: "26 septembre 2026",
  frequence: "1h par jour",
  duree: "5 semaines",
  creneaux: CRENEAUX_STANDARD,
  tarif: "50 €",
};

const TEF_CANADA_DETAILS: ProgrammeDetails = {
  format: "Groupe de 5 apprenants",
  prochaineVague: "26 septembre 2026",
  frequence: "1h par jour",
  duree: "6 semaines",
  creneaux: CRENEAUX_STANDARD,
  tarif: "120 €",
};

function dfpDetails(prochaineVague: string): ProgrammeDetails {
  return {
    format: "Groupe de 5 apprenants",
    prochaineVague,
    frequence: "1h par jour",
    duree: "5 semaines",
    creneaux: CRENEAUX_STANDARD,
    tarif: "100 €",
  };
}

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
    ctaLabel: "Voir le programme et les tarifs",
    inscriptionCtaLabel: "S'inscrire pour le 10 Septembre",
    details: dfpDetails("10 septembre 2026"),
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
    ctaLabel: "Voir le programme et les tarifs",
    inscriptionCtaLabel: "S'inscrire pour le 1er Octobre",
    details: dfpDetails("1er octobre 2026"),
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
    ctaLabel: "Voir le programme et les tarifs",
    inscriptionCtaLabel: "S'inscrire pour le 15 Septembre",
    details: dfpDetails("15 septembre 2026"),
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
    ctaLabel: "Voir le programme et les tarifs",
    inscriptionCtaLabel: "S'inscrire pour le 1er Octobre",
    details: dfpDetails("1er octobre 2026"),
  },
];

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
                ctaLabel="Voir le programme et les tarifs"
                inscriptionCtaLabel="S'inscrire à la Préparation DELF/DALF"
                details={DELF_DALF_DETAILS}
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
                ctaLabel="Voir le programme et les tarifs"
                inscriptionCtaLabel="Maximiser mon Score TEF/TCF"
                details={TEF_CANADA_DETAILS}
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
                    ctaLabel={program.ctaLabel}
                    inscriptionCtaLabel={program.inscriptionCtaLabel}
                    details={program.details}
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
