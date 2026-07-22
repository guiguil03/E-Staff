import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { QuoteBlock } from '@/components/ui/QuoteBlock'
import { LanguageRibbon } from '@/components/LanguageRibbon'
import { ContactForm } from '@/components/ContactForm'

export default function HomePage() {
  return (
    <main>
      <section id="hero" className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-16 grid gap-10 md:grid-cols-2 items-center">
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
            <div className="mt-8 flex flex-col sm:flex-row gap-x-8 gap-y-2 font-mono text-xs text-muted">
              <span>[X] agents formés</span>
              <span>[X] clients internationaux actifs</span>
              <span>Infrastructure sécurisée 24/7</span>
            </div>
          </div>
          <div className="rounded bg-primary p-8 flex flex-col gap-6 justify-center min-h-[400px]">
            <p className="font-mono text-xs text-background/70 uppercase tracking-wide">
              Le niveau visé avant un premier appel client
            </p>
            <p className="font-display text-4xl text-background">B2 minimum</p>
            <LanguageRibbon variant="static" reachedLevel="B2" />
            <p className="text-background/90 text-sm">
              Chaque candidat progresse sur cette échelle avant d&apos;être proposé en
              production. En dessous du seuil, direction l&apos;académie pour continuer à
              progresser, plutôt qu&apos;un refus sans suite.
            </p>
          </div>
        </div>
      </section>

      <section id="probleme" className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl mb-4">Le problème</h2>
          <p className="mb-8 text-muted">
            Ce sont, dans cet ordre, les trois raisons qui font hésiter une entreprise à
            confier son service client à un centre d&apos;appel basé en Afrique.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <h3 className="text-lg mb-2">Profils sous-qualifiés</h3>
              <p className="text-sm text-muted">
                Beaucoup de candidats visés n&apos;ont pas le niveau de langue réel pour
                tenir un appel de 20 minutes, même avec un CV qui dit le contraire. Le
                décalage n&apos;apparaît souvent qu&apos;au premier appel client, une fois le
                coût de recrutement déjà engagé.
              </p>
            </Card>
            <Card>
              <h3 className="text-lg mb-2">Turnover massif</h3>
              <p className="text-sm text-muted">
                Une partie des agents recrutés ailleurs part après un mois, souvent avant
                d&apos;être rentable pour le client qui les a formés. Chaque départ oblige à
                retrouver, réembaucher et reformer un remplaçant, ce qui coûte du temps et
                de l&apos;argent au client plutôt qu&apos;à l&apos;agence.
              </p>
            </Card>
            <Card>
              <h3 className="text-lg mb-2">Infrastructure instable</h3>
              <p className="text-sm text-muted">
                Coupures d&apos;électricité et de connexion en pleine mission client : le
                premier frein cité contre l&apos;outsourcing vers Madagascar. Un appel coupé
                en plein milieu, côté agent, retombe directement sur l&apos;image du client
                final.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section id="solution" className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl mb-8">La solution</h2>
          <div className="flex flex-col gap-6">
            <div className="flex gap-4">
              <span className="font-mono text-2xl text-primary shrink-0">01</span>
              <div>
                <h3 className="text-lg mb-2">Sélection sur test de niveau réel</h3>
                <p className="text-sm text-muted">
                  Avant toute embauche, chaque candidat passe un test de niveau réel, pas
                  une déclaration sur CV. On mesure la capacité à tenir une conversation
                  orale de bout en bout, dans des conditions proches d&apos;un appel client.
                  Seuls les profils qui atteignent le niveau requis sont proposés en
                  production.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="font-mono text-2xl text-primary shrink-0">02</span>
              <div>
                <h3 className="text-lg mb-2">Formation continue pendant la mission</h3>
                <p className="text-sm text-muted">
                  La formation ne s&apos;arrête pas à l&apos;embauche. Chaque agent en poste
                  continue de progresser pendant sa mission, avec un suivi régulier de son
                  niveau de langue et de sa performance sur les appels. L&apos;objectif est
                  de réduire le turnover en gardant les agents motivés et en progression,
                  plutôt que de les laisser stagner.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="font-mono text-2xl text-primary shrink-0">03</span>
              <div>
                <h3 className="text-lg mb-2">Infrastructure sécurisée déjà en place</h3>
                <p className="text-sm text-muted">
                  Onduleurs, secours énergétique et connexion stable sont installés avant
                  l&apos;arrivée du premier agent, pas ajoutés après une première coupure. Le
                  client n&apos;a rien à financer ni à mettre en place de son côté sur ce
                  point : l&apos;infrastructure est déjà opérationnelle et supervisée en
                  continu.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="font-mono text-2xl text-primary shrink-0">04</span>
              <div>
                <h3 className="text-lg mb-2">Le client branche juste ses outils métier</h3>
                <p className="text-sm text-muted">
                  Une fois les agents sélectionnés et l&apos;infrastructure en place, le
                  client connecte simplement son CRM et ses logiciels métier existants.
                  Aucune migration technique n&apos;est demandée côté client : on
                  s&apos;adapte aux outils déjà en place plutôt que d&apos;imposer les nôtres.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="double-moteur" className="bg-primary">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl mb-8 text-background">Le double moteur</h2>
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <Card>
              <h3 className="text-xl mb-3">Académie</h3>
              <ul className="text-sm text-muted flex flex-col gap-2 list-disc pl-4">
                <li>Préparation aux examens internationaux (DELF/DALF, TEF Canada, EAF, DFP)</li>
                <li>Programme FOL pour professionnels et leaders</li>
                <li>Les apprenants paient directement leur formation</li>
              </ul>
            </Card>
            <Card>
              <h3 className="text-xl mb-3">Production B2B</h3>
              <ul className="text-sm text-muted flex flex-col gap-2 list-disc pl-4">
                <li>Agents placés par lots de dix chez des clients internationaux</li>
                <li>Infrastructure sécurisée fournie (onduleurs, secours, connexion stable)</li>
                <li>Supervision continue une fois en poste</li>
              </ul>
            </Card>
          </div>
          <Card className="!bg-background/10 border-success border-2">
            <p className="font-mono text-xs text-background mb-2 uppercase tracking-wide">Aucun candidat n&apos;est perdu</p>
            <p className="text-sm text-background/90">
              Un candidat qui n&apos;atteint pas encore le niveau requis pour un placement
              en production n&apos;est pas refusé sans suite : il est orienté vers une
              formation à l&apos;académie pour élever son niveau. Une fois le niveau requis
              atteint, il redevient éligible à un placement en production, dans la mesure
              où cette orientation reste pertinente pour son profil.
            </p>
          </Card>
        </div>
      </section>

      <section id="confiance" className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl mb-6">Preuve de sérieux</h2>
          <p className="mb-6 text-muted">
            Chaque poste en production est supervisé et mesuré au quotidien avec une
            méthode fixe, appliquée sur des critères écrits à l&apos;avance plutôt qu&apos;un
            suivi ponctuel :
          </p>
          <div className="grid gap-6 md:grid-cols-3 mb-10">
            <div>
              <h3 className="text-lg mb-2">Constat</h3>
              <p className="text-sm text-muted">
                Mesure quotidienne des indicateurs de performance de chaque agent en poste.
              </p>
            </div>
            <div>
              <h3 className="text-lg mb-2">Analyse</h3>
              <p className="text-sm text-muted">
                Identification des causes précises derrière chaque écart constaté.
              </p>
            </div>
            <div>
              <h3 className="text-lg mb-2">Amélioration</h3>
              <p className="text-sm text-muted">
                Ajustement ciblé de la formation ou du process pour corriger l&apos;écart.
              </p>
            </div>
          </div>

          <div className="grid gap-6 grid-cols-2 md:grid-cols-4 mb-10">
            <div>
              <p className="font-mono text-2xl text-primary">[X]</p>
              <p className="text-xs text-muted mt-1">agents formés à venir</p>
            </div>
            <div>
              <p className="font-mono text-2xl text-primary">[X %]</p>
              <p className="text-xs text-muted mt-1">taux de réussite aux examens à venir</p>
            </div>
            <div>
              <p className="font-mono text-2xl text-primary">[X]</p>
              <p className="text-xs text-muted mt-1">postes en production actifs à venir</p>
            </div>
            <div>
              <p className="font-mono text-2xl text-primary">[X %]</p>
              <p className="text-xs text-muted mt-1">rétention à 6 mois à venir</p>
            </div>
          </div>

          <h3 className="text-xl mb-6">Avis</h3>
          <div className="grid gap-6 md:grid-cols-2">
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
            <QuoteBlock
              quote="On nous a apporté un profil qualifié en dix jours, formé et prêt à prendre des appels."
              person={{ firstname: 'Nathalie' }}
              result="apporteuse d&apos;affaires"
            />
          </div>
        </div>
      </section>

      <section id="apporteurs-clients" className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl mb-8">Apporteurs d&apos;affaires et entreprises</h2>
          <div className="grid gap-10 md:grid-cols-2">
            <div className="flex flex-col gap-8">
              <div>
                <h3 className="text-xl mb-2">Devenir apporteur d&apos;affaires</h3>
                <p className="mb-3 text-sm text-muted">
                  Concrètement, voici comment ça fonctionne :
                </p>
                <ul className="text-sm text-muted flex flex-col gap-2 list-disc pl-4">
                  <li>
                    Tu mets en relation un client potentiel avec nous, ou tu apportes un
                    CV qualifié.
                  </li>
                  <li>On qualifie le client ou le candidat, puis on procède au placement.</li>
                  <li>
                    Tu touches une commission mensuelle récurrente tant que le profil
                    reste en poste ou que le contrat client court.
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl mb-2">Vous êtes une entreprise</h3>
                <p className="mb-3 text-sm text-muted">Ce que vous obtenez :</p>
                <ul className="text-sm text-muted flex flex-col gap-2 list-disc pl-4">
                  <li>Des agents sélectionnés sur leur niveau réel, pas déclaré.</li>
                  <li>Une infrastructure fournie et déjà opérationnelle.</li>
                  <li>Une supervision quotidienne des agents en poste.</li>
                  <li>Aucune gestion RH à assurer de votre côté.</li>
                </ul>
                <p className="mt-3 text-sm text-muted">
                  Le seul élément que vous fournissez : vos outils et logiciels métier
                  (CRM, scripts, procédures internes).
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-xl mb-4">Nous contacter</h3>
              <ContactForm defaultSubject="Devenir apporteur d'affaires" />
            </div>
          </div>
        </div>
      </section>

      <section id="offres" className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl mb-4">Offres phares</h2>
          <p className="mb-8 text-muted">
            Trois points d&apos;entrée selon où vous en êtes : préparer un examen précis,
            gagner en aisance à l&apos;oral pour votre poste, ou trouver un emploi en
            production.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <h3 className="text-lg mb-2">Préparation aux examens internationaux</h3>
              <p className="text-sm text-muted mb-4">
                DELF/DALF, TEF Canada, EAF, DFP — préparation ciblée par niveau, du A2 au
                C1, en groupes restreints avec tests blancs chronométrés.
              </p>
              <Button href="/offres/examens" variant="ghost">
                Voir la préparation aux examens
              </Button>
            </Card>
            <Card>
              <h3 className="text-lg mb-2">Programme FOL</h3>
              <p className="text-sm text-muted mb-4">
                Français oratoire pour professionnels et leaders qui parlent déjà bien
                mais ont besoin de plus d&apos;impact à l&apos;oral, en réunion ou face à un
                public.
              </p>
              <Button href="/offres/fol" variant="ghost">
                Voir le programme FOL
              </Button>
            </Card>
            <Card>
              <h3 className="text-lg mb-2">Vous cherchez du travail ?</h3>
              <p className="text-sm text-muted mb-4">
                Déposez votre CV et vos coordonnées, puis passez une évaluation en ligne :
                on vous recontacte avec la suite adaptée à votre niveau.
              </p>
              <Button href="/offres/carrieres" variant="accent">
                Déposer ma candidature
              </Button>
            </Card>
          </div>
        </div>
      </section>

      <section id="parcours" className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl mb-8">Parcours candidat</h2>
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex gap-4">
              <span className="font-mono text-2xl text-primary shrink-0">01</span>
              <div>
                <h3 className="text-lg mb-2">Dépôt du CV et des coordonnées</h3>
                <p className="text-sm text-muted">
                  Vous déposez votre CV et vos coordonnées via la page candidature. Cette
                  première étape ne prend que quelques minutes.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="font-mono text-2xl text-primary shrink-0">02</span>
              <div>
                <h3 className="text-lg mb-2">Passage d&apos;un test d&apos;évaluation en ligne</h3>
                <p className="text-sm text-muted">
                  Vous passez ensuite un test d&apos;évaluation en ligne qui mesure votre
                  niveau réel, pour orienter la suite du parcours vers l&apos;option la plus
                  adaptée.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="font-mono text-2xl text-primary shrink-0">03</span>
              <div>
                <h3 className="text-lg mb-2">Orientation selon le niveau</h3>
                <p className="text-sm text-muted">
                  Si le niveau est suffisant, vous accédez directement aux postes en
                  production. En dessous du niveau requis, vous êtes orienté vers un
                  renforcement à l&apos;académie plutôt que laissé sans suite — l&apos;idée
                  reste la même que partout ailleurs sur ce site : aucun candidat
                  n&apos;est perdu.
                </p>
              </div>
            </div>
          </div>
          <Button href="/offres/carrieres" variant="accent">
            Déposer ma candidature
          </Button>
        </div>
      </section>
    </main>
  )
}
