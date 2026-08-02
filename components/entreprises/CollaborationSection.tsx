import Reveal from "@/components/Reveal";
import LotCard from "@/components/entreprises/LotCard";
import MissionCard from "@/components/entreprises/MissionCard";

const LOTS = [
  {
    name: 'Lot de 10 "Setters"',
    mission:
      "Saturez vos agendas, brisez les barrières et qualifiez un maximum de prospects pour remplir votre pipeline commercial.",
    trainingEndDate: "15 Août 2026",
    segment: "lot-setters",
  },
  {
    name: 'Lot de 10 "Closers"',
    mission:
      "Maîtrisez la négociation à fort impact, éliminez les dernières objections et transformez vos prospects chauds en cash immédiat.",
    trainingEndDate: "18 Août 2026",
    segment: "lot-closers",
  },
  {
    name: 'Lot de 10 "Campagnes Collecte de Dons"',
    mission:
      "Maniez la persuasion avec une rigueur absolue pour convaincre, engager et décrocher des prélèvements automatiques et des dons à fort volume.",
    trainingEndDate: "25 Août 2026",
    segment: "lot-collecte-dons",
  },
  {
    name: 'Lot de 10 "Campagnes & Mailing"',
    mission:
      "Inondez les boîtes de réception et pilotez des campagnes de prospection écrite à haut taux de conversion.",
    trainingEndDate: "1er Septembre 2026",
    segment: "lot-campagnes-mailing",
  },
  {
    name: 'Lot de 10 "Opérateurs Téléphoniques & Support"',
    mission:
      "Maîtrisez la voix, encadrez chaque interaction et gérez vos flux de support et d'appels massifs sans fausse note.",
    trainingEndDate: "10 Août 2026",
    segment: "lot-operateurs-telephoniques",
  },
  {
    name: 'Lot de 10 "Opérateurs de Saisie & Back-Office"',
    mission:
      "Alimentez vos CRM, nettoyez vos fichiers et garantissez une rigueur administrative infaillible.",
    trainingEndDate: "20 Août 2026",
    segment: "lot-saisie-back-office",
  },
];

const MISSIONS = [
  {
    title: "Voix Off",
    subtitle: "L'Autorité Vocale",
    description:
      "Ne confiez pas votre image à une voix sans relief. Dominez l'attention dès la première seconde sur vos spots publicitaires, modules e-learning ou vidéos de vente.",
    available: true,
    statusDetail: "Livraison sous 24/48h.",
    ctaLabel: "Démarrer ce projet",
    segment: "mission-voix-off",
  },
  {
    title: "Montage Vidéo",
    subtitle: "Le Rythme qui Perce",
    description:
      "Captivez les algorithmes et pulvérisez l'attention. Du format court (TikTok, Reels, Shorts) au montage institutionnel.",
    available: true,
    statusDetail: "Livraison rapide, délai communiqué sur devis.",
    ctaLabel: "Démarrer ce projet",
    segment: "mission-montage-video",
  },
  {
    title: "Assistanat Virtuel",
    subtitle: "Le Sceau de l'Exécutif",
    description:
      "Vous êtes dirigeant, pas secrétaire. Libérez votre temps stratégique en déléguant la gestion d'agendas complexes et le filtrage d'urgence à une élite rigoureuse.",
    available: false,
    statusDetail: "Prochain créneau : 10 Août 2026.",
    ctaLabel: "Réserver mon créneau",
    segment: "mission-assistanat-virtuel",
  },
  {
    title: "Copywriting & Rédaction",
    subtitle: "Les Mots qui Frappent",
    description:
      "Pages de vente, e-mails et scripts rédigés pour convertir, pas seulement pour être lus.",
    available: true,
    statusDetail: "Disponible immédiatement.",
    ctaLabel: "Démarrer ce projet",
    segment: "mission-copywriting",
  },
];

// "Vos Options de Collaboration" — the two collaboration models: the
// long-term squad (lots of 10) and punctual missions/prestations.
export default function CollaborationSection() {
  return (
    <>
      <section className="bg-obsidian px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-display text-2xl font-bold text-accent sm:text-3xl md:text-4xl">
                Vos Options de Collaboration
              </h2>
              <p className="mt-4 font-sans text-base text-white/70 sm:text-lg">
                Le recrutement classique est un gouffre financier.
                L&apos;externalisation d&apos;élite est votre seul levier de
                croissance réel. Vos chiffres stagnent&nbsp;? On sait tous que
                cela n&apos;a jamais été un problème de volume, c&apos;est un
                problème d&apos;impact. Changez de standard. Chez e-Staf, nous
                ne vous vendons pas des promesses sur un CV. Nous déployons
                des unités d&apos;élite formées au combat commercial, armées
                jusqu&apos;aux dents sur la voix et sur l&apos;écrit, prêtes à
                cartonner et changer la donne.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-14">
              <p className="font-mono text-xs uppercase tracking-widest text-accent">
                Option 1
              </p>
              <h3 className="mt-2 font-display text-xl font-bold text-white sm:text-2xl">
                La Squad Long Terme (Lots de 10)
              </h3>
              <p className="mt-3 max-w-3xl font-sans text-sm text-white/60 sm:text-base">
                Sécurisez votre structure. Intégrez instantanément 10 Setters
                ou Closers calibrés pour encaisser la charge, tenir la cadence
                et transformer chaque fichier froid en source de revenus
                durable.
              </p>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {LOTS.map((lot) => (
                <LotCard key={lot.segment} {...lot} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-white/10 bg-obsidian px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              Option 2
            </p>
            <h3 className="mt-2 font-display text-xl font-bold text-white sm:text-2xl">
              Missions &amp; Prestations Ponctuelles
            </h3>
            <p className="mt-3 max-w-3xl font-sans text-sm text-white/60 sm:text-base">
              Pas de temps à perdre avec des intermédiaires mous ni
              d&apos;équipe complète à l&apos;année. Confiez vos projets à
              haute exigence à des experts affûtés. Un besoin précis, une
              exécution foudroyante, un résultat mesurable.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {MISSIONS.map((mission) => (
                <MissionCard key={mission.segment} {...mission} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
