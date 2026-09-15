import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";

interface MonDossierProps {
  dateInscription: string; // ISO
  seancesRestantes: number;
  seancesTotal: number;
  echeanceRenouvellement: string | null; // ISO — non défini tant que la RH ne l'a pas saisie
}

function formatDateFr(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const STATUT_STYLES = {
  vert: { dot: "bg-success", text: "text-success", border: "border-success/40" },
  orange: { dot: "bg-accent", text: "text-accent", border: "border-accent/40" },
  // Pas de rouge dans la palette e-Staf — le teal fait office de second
  // signal d'alerte, comme ailleurs dans l'app (cf. Cockpit Formateur).
  rouge: { dot: "bg-teal", text: "text-teal", border: "border-teal/40" },
  // Échéance pas encore fixée par la RH — état neutre, ni "à jour" ni "en retard".
  indefini: { dot: "bg-white/40", text: "text-white/50", border: "border-white/20" },
} as const;

// "Mon Casier" — dossier administratif de l'apprenant (contrat, dates,
// séances restantes, renouvellement). Ajouté sous "Contacter le formateur"
// pour équilibrer visuellement la colonne de droite (retour client,
// 2026-08-05). Contrat et paiement en ligne sont des états "bientôt
// disponible" honnêtes : aucun backend de facturation/documents n'existe
// encore (module 5 RH & Administratif de la roadmap).
export default function MonDossier({
  dateInscription,
  seancesRestantes,
  seancesTotal,
  echeanceRenouvellement,
}: MonDossierProps) {
  const daysUntilEcheance = echeanceRenouvellement
    ? Math.ceil((new Date(echeanceRenouvellement).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const statutKey =
    daysUntilEcheance === null
      ? null
      : daysUntilEcheance < 0
        ? "rouge"
        : daysUntilEcheance <= 5
          ? "orange"
          : "vert";
  const statutLabel =
    statutKey === "rouge"
      ? "Paiement en retard"
      : statutKey === "orange"
        ? `Échéance proche (dans ${daysUntilEcheance} j)`
        : statutKey === "vert"
          ? "À jour"
          : "Non défini";
  const statutStyle = statutKey ? STATUT_STYLES[statutKey] : STATUT_STYLES.indefini;

  const seancesFaibles = seancesRestantes <= 2;
  const echeanceProche = daysUntilEcheance !== null && daysUntilEcheance >= 0 && daysUntilEcheance <= 5;

  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <h3 className="font-display text-base font-semibold text-white">Mon Casier</h3>

        {(seancesFaibles || echeanceProche) && (
          <div className="mt-3 rounded border border-accent bg-accent/10 px-3 py-2 font-sans text-xs text-accent">
            {seancesFaibles &&
              `Il ne vous reste que ${seancesRestantes} séance${seancesRestantes > 1 ? "s" : ""}. `}
            {/* echeanceProche implique echeanceRenouvellement non nul (même garde). */}
            {echeanceProche &&
              `Pensez à renouveler vos frais avant le ${formatDateFr(echeanceRenouvellement!)}.`}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <p className="font-sans text-sm text-white/80">Contrat</p>
          <Button variant="ghostDark" disabled>
            Consulter mon contrat
          </Button>
        </div>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/30">
          Bientôt disponible
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
          <p className="font-sans text-sm text-white/80">Date d&apos;inscription</p>
          <p className="font-mono text-sm text-white">{formatDateFr(dateInscription)}</p>
        </div>

        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between">
            <p className="font-sans text-sm text-white/80">Séances restantes</p>
            <p className="font-mono text-sm text-white">
              {seancesRestantes} / {seancesTotal}
            </p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-accent"
              style={{
                width: `${seancesTotal > 0 ? (seancesRestantes / seancesTotal) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between">
            <p className="font-sans text-sm text-white/80">Renouvellement des frais</p>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] ${statutStyle.border} ${statutStyle.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statutStyle.dot}`} />
              {statutLabel}
            </span>
          </div>
          <p className="mt-1.5 font-sans text-xs text-white/50">
            {echeanceRenouvellement
              ? `À renouveler avant le ${formatDateFr(echeanceRenouvellement)}`
              : "Échéance pas encore fixée par la RH."}
          </p>
          <Button variant="dark" className="mt-3 w-full justify-center" disabled>
            Procéder au paiement / Renouveler
          </Button>
          <p className="mt-1 text-center font-mono text-[10px] uppercase tracking-widest text-white/30">
            Bientôt disponible
          </p>
        </div>

        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between">
            <p className="font-sans text-sm text-white/80">Historique des séances</p>
            <Button variant="ghostDark" disabled>
              Voir le détail
            </Button>
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-white/30">
            Bientôt disponible
          </p>
        </div>
      </div>
    </Reveal>
  );
}
