import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { QuoteBlock } from '@/components/ui/QuoteBlock'
import { LanguageRibbon } from '@/components/LanguageRibbon'
import { ContactForm } from '@/components/ContactForm'
import { LandingNav } from '@/components/LandingNav'

export default function HomePage() {
  return (
    <>
      <LandingNav />
      <main>
        <section id="hero" className="mx-auto max-w-5xl px-4 py-16 grid gap-10 md:grid-cols-2 items-center">
          <div>
            <p className="font-mono text-xs text-muted mb-3">
              Niveau de langue. Turnover. Coupures d&apos;électricité.
            </p>
            <LanguageRibbon variant="animated" reachedLevel="B2" />
            <h1 className="text-3xl md:text-4xl mt-6 mb-4">
              On règle les trois avant que l&apos;agent ne prenne son premier appel.
            </h1>
            <p className="mb-6 text-muted">
              Sélection sur niveau réel, formation continue, infrastructure secourue
              (onduleurs, connexion stable). Résultat : des agents qui tiennent dans la
              durée, pas des CV qui déclarent un niveau.
            </p>
            <QuoteBlock
              quote="Je ne pensais pas tenir une conversation de 20 minutes sans bloquer."
              person={{ firstname: 'Fara' }}
              result="poste de support client international"
            />
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button href="/offres/carrieres" variant="accent">
                Déposer ma candidature
              </Button>
              <Button href="#apporteurs-clients" variant="primary">
                Je suis une entreprise ou un apporteur d&apos;affaires
              </Button>
            </div>
          </div>
          <Image
            src="/images/hero-placeholder.jpg"
            alt="Fara, en formation"
            width={480}
            height={560}
            className="rounded object-cover w-full h-auto"
          />
        </section>

        <section id="probleme" className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl mb-8">Le problème</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <h3 className="text-lg mb-2">Profils sous-qualifiés</h3>
              <p className="text-sm text-muted">
                Beaucoup de candidats visés n&apos;ont pas le niveau de langue réel pour
                tenir un appel de 20 minutes, même avec un CV qui dit le contraire.
              </p>
            </Card>
            <Card>
              <h3 className="text-lg mb-2">Turnover massif</h3>
              <p className="text-sm text-muted">
                Une partie des agents recrutés ailleurs part après un mois, souvent avant
                d&apos;être rentable pour le client qui les a formés.
              </p>
            </Card>
            <Card>
              <h3 className="text-lg mb-2">Infrastructure instable</h3>
              <p className="text-sm text-muted">
                Coupures d&apos;électricité et de connexion en pleine mission client : le
                premier frein cité contre l&apos;outsourcing vers Madagascar.
              </p>
            </Card>
          </div>
        </section>

        <section id="solution" className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl mb-8">La solution</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <h3 className="text-lg mb-2">Sélection stricte + formation continue</h3>
              <p className="text-sm text-muted">
                On teste le niveau réel avant l&apos;embauche, puis on forme en continu.
                Des profils fiables, pas des niveaux déclarés.
              </p>
            </Card>
            <Card>
              <h3 className="text-lg mb-2">Infrastructure déjà financée</h3>
              <p className="text-sm text-muted">
                Onduleurs, secours énergétique, connexion stable : en place avant
                l&apos;arrivée du premier agent. Zéro coupure côté agent.
              </p>
            </Card>
            <Card>
              <h3 className="text-lg mb-2">Vous apportez vos outils</h3>
              <p className="text-sm text-muted">
                CRM, logiciels métier, scripts : vous branchez ce que vous utilisez déjà.
                Aucune friction technique de votre côté.
              </p>
            </Card>
          </div>
        </section>

        <section id="double-moteur" className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl mb-8">Le double moteur</h2>
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <Card>
              <h3 className="text-xl mb-2">Académie</h3>
              <p className="text-sm text-muted">
                Formation en langues : préparation aux examens internationaux et
                programme FOL pour professionnels. Les apprenants paient directement
                leur formation.
              </p>
            </Card>
            <Card>
              <h3 className="text-xl mb-2">Production B2B</h3>
              <p className="text-sm text-muted">
                Des agents formés, placés par lots de dix chez des clients
                internationaux de centres d&apos;appels, avec supervision continue.
              </p>
            </Card>
          </div>
          <Card className="border-success border-2">
            <p className="font-mono text-xs text-success mb-2">Aucun candidat n&apos;est perdu</p>
            <p>
              Ceux qui n&apos;atteignent pas encore le niveau requis pour la production
              rejoignent l&apos;académie plutôt que d&apos;être refusés.
            </p>
          </Card>
        </section>

        <section id="confiance" className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl mb-8">Preuve de sérieux</h2>
          <p className="mb-4 text-muted">
            Chaque poste en production est supervisé et mesuré au quotidien avec une
            méthode fixe : Constat, Analyse, Amélioration. Pas de suivi ponctuel — une
            revue chaque jour, sur des critères écrits à l&apos;avance.
          </p>
          <ul className="mb-10 flex flex-col gap-1 font-mono text-xs text-muted">
            <li>[nombre d&apos;agents formés à venir]</li>
            <li>[taux de réussite aux examens à venir]</li>
            <li>[nombre de postes en production actifs à venir]</li>
          </ul>

          <h3 className="text-xl mb-6">Avis</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <QuoteBlock
              quote="Le rythme est soutenu, mais on sait exactement où on en est chaque semaine."
              person={{ firstname: 'Iavo' }}
              result="agent en production, client international"
            />
            <QuoteBlock
              quote="J&apos;ai raté le niveau pour la production, on m&apos;a proposé l&apos;académie au lieu de me dire non."
              person={{ firstname: 'Tovo' }}
              result="apprenant, préparation DELF B1"
            />
            <QuoteBlock
              quote="La coupure de courant, c&apos;est le premier truc que j&apos;ai vérifié avant de signer. Ça n&apos;a jamais lâché."
              person={{ firstname: 'Marc' }}
              result="client, centre d&apos;appel partenaire"
            />
          </div>
        </section>

        <section id="apporteurs-clients" className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl mb-8">Apporteurs d&apos;affaires et entreprises</h2>
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h3 className="text-xl mb-2">Devenir apporteur d&apos;affaires</h3>
              <p className="mb-4 text-sm text-muted">
                Vous mettez en relation un client avec nous, ou vous apportez un CV.
                Si le client signe ou si le profil est placé en production, vous touchez
                une commission mensuelle récurrente tant que le contrat court.
              </p>
              <h3 className="text-xl mb-2">Vous êtes une entreprise</h3>
              <p className="text-sm text-muted">
                Besoin d&apos;agents formés pour votre centre d&apos;appel ou votre service
                client ? Décrivez votre besoin ci-contre, on revient vers vous avec un
                plan concret.
              </p>
            </div>
            <div>
              <h3 className="text-xl mb-4">Nous contacter</h3>
              <ContactForm defaultSubject="Devenir apporteur d'affaires" />
            </div>
          </div>
        </section>

        <section id="offres" className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl mb-8">Offres phares</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <h3 className="text-lg mb-2">Préparation aux examens internationaux</h3>
              <p className="text-sm text-muted mb-4">
                DELF/DALF, TEF Canada, EAF, DFP — préparation ciblée par niveau, du A2 au C1.
              </p>
              <Button href="/offres/examens" variant="ghost">
                Voir la préparation aux examens
              </Button>
            </Card>
            <Card>
              <h3 className="text-lg mb-2">Programme FOL</h3>
              <p className="text-sm text-muted mb-4">
                Français oratoire pour professionnels et leaders.
              </p>
              <Button href="/offres/fol" variant="ghost">
                Voir le programme FOL
              </Button>
            </Card>
            <Card>
              <h3 className="text-lg mb-2">Vous cherchez du travail ?</h3>
              <p className="text-sm text-muted mb-4">
                Déposez votre candidature, on vous recontacte.
              </p>
              <Button href="/offres/carrieres" variant="accent">
                Déposer ma candidature
              </Button>
            </Card>
          </div>
        </section>
      </main>
    </>
  )
}
