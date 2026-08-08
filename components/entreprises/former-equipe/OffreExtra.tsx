import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import FunnelSteps from "./FunnelSteps";

const BOOTCAMP_MODULES = [
  "Storytelling & Pitch Exécutif (Captiver & convaincre)",
  "Négociation Stratégique & Closing (Persuasion & objections)",
  "Posture, Charisme & Leadership (Présence & animation de réunions)",
  "Rédaction Haute Précision (E-mails stratégiques & synthèses VIP)",
  "Communication de Crise (Prise de parole sous pression)",
  "Networking & Codes B2B (Mises en situation lors des repas d'affaires)",
];

const FUNNEL = ["Test Initial", "TOP 20 Retenus", "Sélection 5 Semaines (-3/sem)", "TOP 5 Finalistes", "Immersion 7 Jours"];

// Section 4 — deux offres complémentaires à "Choisissez votre secteur" :
// l'abonnement Vivier B2B (recrutement de talents déjà formés, pas de
// formation interne) et le Bootcamp Intensif (programme d'élite ultra-
// sélectif). Pas de prix affiché sur le Vivier, conformément à la politique
// "Transparence & Confidentialité Tarifaire" déjà établie sur /entreprises
// (PromisesSection.tsx) — les grilles tarifaires ne sont communiquées que
// dans le contrat.
export default function OffreExtra() {
  return (
    <section className="bg-obsidian px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">Offre extra</p>
            <h2 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              Vous cherchez de nouveaux talents prêts à l&apos;emploi ?
            </h2>
            <p className="mt-3 font-sans text-base text-white/70">
              Vous souhaitez plutôt renforcer rapidement vos effectifs avec du personnel déjà
              qualifié ?
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-10 rounded border border-white/10 bg-obsidianCard p-6 sm:p-8">
            <p className="font-display text-lg font-bold text-white">
              👑 Formule &laquo;&nbsp;Abonnement Vivier B2B&nbsp;&raquo;
            </p>
            <p className="mt-2 font-mono text-xs uppercase tracking-widest text-accent">
              Tarif communiqué sur demande — Engagement 1 an
            </p>
            <p className="mt-4 font-sans text-sm leading-relaxed text-white/70">
              Accédez à notre Vivier Certifié C1 et piochez jusqu&apos;à 2 SQUADS (20 agents
              pré-qualifiés / trimestre durant l&apos;année) selon vos besoins de recrutement.
            </p>
            <p className="mt-2 font-sans text-sm leading-relaxed text-white/70">
              Garantie de remplacement 48h incluse pour chaque recrutement.
            </p>
            <div className="mt-6">
              <Button
                variant="ghostDark"
                href="/entreprises/former-son-equipe/rendez-vous?secteur=vivier&motif=devis"
              >
                Demander un accès au Vivier
              </Button>
            </div>
          </div>
        </Reveal>

        <Reveal delay={180}>
          <div className="mt-6 rounded border border-accent/50 bg-obsidianCard p-6 sm:p-8">
            <p className="font-display text-lg font-bold uppercase tracking-wide text-white sm:text-xl">
              🔥 Bootcamp Intensif : Français des Affaires{" "}
              <span className="text-accent">(7 jours en immersion)</span>
            </p>
            <p className="mt-3 font-sans text-sm italic leading-relaxed text-white/80">
              &laquo;&nbsp;7 jours hors du cadre professionnel pour maîtriser les codes du
              leadership, du pitch et de la négociation B2B. Résidence VIP.&nbsp;&raquo;
            </p>

            <p className="mt-6 font-mono text-xs uppercase tracking-widest text-accent">
              6 modules d&apos;élite
            </p>
            <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              {BOOTCAMP_MODULES.map((m, i) => (
                <li key={m} className="flex gap-2 font-sans text-sm text-white/70">
                  <span className="text-accent">{i + 1}.</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-6 font-mono text-xs uppercase tracking-widest text-white/50">
              <span>🏰 Hébergement, restauration & formation tout-en-un</span>
              <span>👑 Ultra-Sélectif : 5 places max / session</span>
              <span>🗓️ 2 éditions / an</span>
            </div>

            <div className="mt-8">
              <FunnelSteps steps={FUNNEL} />
            </div>

            <p className="mt-6 font-sans text-sm leading-relaxed text-white/60">
              Seuls les 20 meilleurs dossiers admis pourront s&apos;inscrire à la phase de
              présélection. 5 semaines de challenges&nbsp;; 3 candidats sont éliminés par
              semaine. Le programme détaillé, le lieu d&apos;exception (hôtel/villa privatisée)
              et le corps professoral ne sont révélés qu&apos;aux 5 finalistes qualifiés.
            </p>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row">
              <Button
                variant="dark"
                href="/entreprises/former-son-equipe/rendez-vous?secteur=bootcamp&motif=audit"
              >
                📝 Tester sur 5 collaborateurs (Audit Gratuit)
              </Button>
              <Button
                variant="ghostDark"
                href="/entreprises/former-son-equipe/rendez-vous?secteur=bootcamp&motif=devis"
              >
                📞 Demander un devis
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
