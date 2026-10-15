import Reveal from "@/components/Reveal";
import LotCard from "@/components/entreprises/LotCard";
import MissionCard from "@/components/entreprises/MissionCard";
import { fetchOffresEntreprises, formatDateFr } from "@/lib/offresEntreprises";

// "Vos Options de Collaboration" — the two collaboration models: the
// long-term squad (lots of 10) and punctual missions/prestations. Lots and
// missions come from the API (managed in the Portail RH, /compte/admin/offres-entreprises).
export default async function CollaborationSection() {
  const { lots, missions } = await fetchOffresEntreprises();
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
              {lots.map((lot) => (
                <LotCard
                  key={lot.id}
                  name={lot.nom}
                  mission={lot.mission}
                  trainingEndDate={formatDateFr(lot.dateFinFormation)}
                  statutLabel={lot.statutLabel}
                  segment={lot.segment}
                />
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
              {missions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  title={mission.titre}
                  subtitle={mission.sousTitre}
                  description={mission.description}
                  available={mission.disponible}
                  statusDetail={mission.detailStatut}
                  ctaLabel={mission.ctaLabel}
                  segment={mission.segment}
                />
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
