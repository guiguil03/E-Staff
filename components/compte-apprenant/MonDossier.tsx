"use client";

import { useEffect, useState, type FormEvent } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiGet, apiUpload, ApiError } from "@/lib/api";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/+$/, "");

interface MonDossierProps {
  matricule: string;
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

interface RenewalInfo {
  typeCours: string | null;
  frais: number | null;
  renewalPaymentReference: string | null;
  renewalRequestedAt: string | null;
  paymentInfo: {
    mobileMoneyMg: string | null;
    ribLocal: string | null;
    international: string | null;
  };
}

// "Mon Casier" — dossier administratif de l'apprenant (contrat, dates,
// séances restantes, renouvellement). Ajouté sous "Contacter le formateur"
// pour équilibrer visuellement la colonne de droite (retour client,
// 2026-08-05).
//
// Contrat et renouvellement branchés le 2026-09-29 :
// - Contrat : EvaluationService.getContractForApprenant — seul un compte
//   issu du pipeline test d'admission en a un (voir Apprenant.
//   evaluationAttempt), un compte créé directement par la RH n'en a pas,
//   d'où l'état "indisponible" plutôt qu'une erreur.
// - Renouvellement : flux déclaratif (référence + reçu facultatif + CGU,
//   même principe que Registration/ContratInscrit) — voir NotationService.
//   submitRenewalPayment. Le formateur reste seul à fixer la nouvelle
//   échéance après vérification (voir PaymentAlertsTable côté Cockpit,
//   CockpitService.setAbonnementExpireAt qui efface la demande en attente
//   à la confirmation) ; ceci ne fait que la lui transmettre.
export default function MonDossier({
  matricule,
  dateInscription,
  seancesRestantes,
  seancesTotal,
  echeanceRenouvellement,
}: MonDossierProps) {
  const [contrat, setContrat] = useState<"chargement" | "disponible" | "indisponible">(
    "chargement"
  );

  useEffect(() => {
    // 404 = pas de tentative d'évaluation associée, ou contrat pas encore
    // envoyé — état normal pour un compte créé directement par la RH, pas
    // une panne à distinguer d'une vraie erreur réseau pour cet affichage.
    apiGet(`/evaluation/apprenants/${matricule}/contrat`)
      .then(() => setContrat("disponible"))
      .catch(() => setContrat("indisponible"));
  }, [matricule]);

  const [renewalOpen, setRenewalOpen] = useState(false);
  const [renewal, setRenewal] = useState<RenewalInfo | "chargement" | "erreur" | null>(null);
  const [reference, setReference] = useState("");
  const [recu, setRecu] = useState<File | null>(null);
  const [cguAccepted, setCguAccepted] = useState(false);
  const [renewalStatus, setRenewalStatus] = useState<"idle" | "sending" | "error">("idle");
  const [renewalError, setRenewalError] = useState<string | null>(null);

  function toggleRenewal() {
    setRenewalOpen((open) => !open);
    if (renewal === null) {
      setRenewal("chargement");
      apiGet<RenewalInfo>(`/apprenants/${matricule}/renouvellement`)
        .then(setRenewal)
        .catch(() => setRenewal("erreur"));
    }
  }

  async function submitRenewal(e: FormEvent) {
    e.preventDefault();
    if (!reference.trim() || !cguAccepted) return;
    setRenewalStatus("sending");
    setRenewalError(null);
    try {
      const formData = new FormData();
      formData.append("reference", reference);
      formData.append("cguAccepted", "true");
      if (recu) formData.append("recu", recu);
      const updated = await apiUpload<{ renewalPaymentReference: string; renewalRequestedAt: string }>(
        `/apprenants/${matricule}/renouvellement`,
        formData
      );
      setRenewal((r) => (r && r !== "chargement" && r !== "erreur" ? { ...r, ...updated } : r));
      setReference("");
      setRecu(null);
      setCguAccepted(false);
      setRenewalStatus("idle");
    } catch (err) {
      setRenewalStatus("error");
      setRenewalError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    }
  }

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
          {contrat === "disponible" ? (
            <Button
              variant="ghostDark"
              href={`${API_URL}/evaluation/apprenants/${matricule}/contrat/pdf`}
              linkProps={{ target: "_blank", rel: "noreferrer" }}
            >
              Consulter mon contrat
            </Button>
          ) : (
            <Button variant="ghostDark" disabled>
              Consulter mon contrat
            </Button>
          )}
        </div>
        {contrat === "indisponible" && (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/30">
            Aucun contrat disponible pour ce compte
          </p>
        )}

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

          <Button variant="dark" className="mt-3 w-full justify-center" onClick={toggleRenewal}>
            {renewalOpen ? "Fermer" : "Procéder au paiement / Renouveler"}
          </Button>

          {renewalOpen && (
            <div className="mt-3 rounded border border-white/10 bg-obsidian p-4">
              {renewal === "chargement" && (
                <p className="font-sans text-xs text-white/50">Chargement...</p>
              )}
              {renewal === "erreur" && (
                <p className="font-sans text-xs text-white/50">
                  Impossible de charger les informations de renouvellement pour le moment.
                </p>
              )}
              {renewal && renewal !== "chargement" && renewal !== "erreur" && (
                <>
                  {renewal.frais !== null && (
                    <p className="font-sans text-xs text-white/70">
                      Frais de renouvellement ({renewal.typeCours}) :{" "}
                      <span className="text-white">{renewal.frais.toLocaleString("fr-FR")} Ar</span>
                    </p>
                  )}

                  {(renewal.paymentInfo.mobileMoneyMg ||
                    renewal.paymentInfo.ribLocal ||
                    renewal.paymentInfo.international) && (
                    <div className="mt-3 space-y-2 rounded border border-white/10 bg-obsidianCard p-3">
                      {renewal.paymentInfo.mobileMoneyMg && (
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                            Mobile Money (Madagascar)
                          </p>
                          <p className="mt-0.5 whitespace-pre-line font-sans text-xs text-white/80">
                            {renewal.paymentInfo.mobileMoneyMg}
                          </p>
                        </div>
                      )}
                      {renewal.paymentInfo.ribLocal && (
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                            Virement bancaire (Madagascar)
                          </p>
                          <p className="mt-0.5 whitespace-pre-line font-sans text-xs text-white/80">
                            {renewal.paymentInfo.ribLocal}
                          </p>
                        </div>
                      )}
                      {renewal.paymentInfo.international && (
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                            Depuis l&apos;étranger
                          </p>
                          <p className="mt-0.5 whitespace-pre-line font-sans text-xs text-white/80">
                            {renewal.paymentInfo.international}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {renewal.renewalPaymentReference ? (
                    <div className="mt-3 rounded border border-white/10 bg-obsidianCard p-3">
                      <p className="font-sans text-xs text-white/80">
                        Référence transmise :{" "}
                        <span className="text-white">{renewal.renewalPaymentReference}</span>
                      </p>
                      <p className="mt-1 font-sans text-xs text-white/50">
                        Votre formateur vérifie votre paiement et confirmera votre renouvellement
                        prochainement.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={submitRenewal} className="mt-3 space-y-2">
                      <input
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="Référence de la transaction"
                        aria-label="Référence de la transaction"
                        required
                        className="w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-xs text-white placeholder:text-white/30 outline-none focus:border-accent"
                      />
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        onChange={(e) => setRecu(e.target.files?.[0] ?? null)}
                        aria-label="Reçu de paiement (PDF, JPEG, PNG ou WebP)"
                        className="w-full font-sans text-xs text-white/70 file:mr-3 file:rounded file:border-0 file:bg-accent file:px-3 file:py-1 file:font-sans file:text-xs file:text-obsidian"
                      />
                      <label className="flex items-start gap-2 font-sans text-[11px] text-white/60">
                        <input
                          type="checkbox"
                          checked={cguAccepted}
                          onChange={(e) => setCguAccepted(e.target.checked)}
                          required
                          className="mt-0.5"
                        />
                        <span>J&apos;accepte les Conditions Générales d&apos;Utilisation et d&apos;Inscription.</span>
                      </label>
                      <Button
                        type="submit"
                        variant="ghostDark"
                        className="w-full justify-center"
                        disabled={renewalStatus === "sending" || !reference.trim() || !cguAccepted}
                      >
                        {renewalStatus === "sending" ? "Envoi..." : "Envoyer ma référence"}
                      </Button>
                      {renewalError && <p className="font-mono text-xs text-accent">{renewalError}</p>}
                    </form>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between">
            <p className="font-sans text-sm text-white/80">Historique des séances</p>
            {/* La table "Mes séances & notation" existe déjà plus haut sur
                ce même tableau de bord (voir MesNotationsTable.tsx) — ce
                bouton y renvoie plutôt que de dupliquer l'affichage. */}
            <Button variant="ghostDark" href="#mes-notations">
              Voir le détail
            </Button>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
