"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiGet, apiPostAuthed } from "@/lib/api";
import { COMPETENCY_DEFS } from "@/components/compte-formateur/gradingGrids";
import { adminHeaders } from "./adminHeaders";

interface Notation {
  id: string;
  competence: string;
  scoreOn20: number | null;
  gradedAt: string | null;
}

interface SeanceNotations {
  numero: number;
  startAt: string | null;
  notations: Notation[];
}

interface Presence {
  seanceNumero: number;
  joinedAt: string;
  leftAt: string | null;
  dureeSecondes: number | null;
}

interface MissionHistorique {
  clientNom: string;
  role: string;
  dateDebut: string;
  dateFin: string | null;
  superviseurNom: string | null;
  qualityScore: number | null;
}

interface PersonneCasier {
  attemptId: string;
  candidat: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    coordonneesRecuesLe: string;
  };
  test: {
    statut: string;
    submittedAt: string | null;
    gradedAt: string | null;
    lexiqueScore: number | null;
    oralScore: number | null;
    situationsScore: number | null;
    videoScore: number | null;
    essayScore: number | null;
    totalScore: number | null;
    tier: string | null;
  };
  contrat: {
    duree: string | null;
    frais: string | null;
    conditions: string | null;
    envoyeLe: string | null;
  };
  resultats: {
    envoyesLe: string | null;
    canal: string | null;
    modele: string | null;
  };
  paiement: {
    reference: string | null;
    confirmeLe: string | null;
  };
  formation: {
    matricule: string;
    groupeLabel: string;
    typeCours: string | null;
    formateurNom: string | null;
    abonnementExpireAt: string | null;
    historiqueNotations: SeanceNotations[];
    historiquePresences: Presence[];
  } | null;
  production: MissionHistorique[];
}

const STATUS_LABELS: Record<string, string> = {
  en_cours: "Test en cours",
  soumis: "Test soumis",
  en_correction: "En correction",
  corrige: "Corrigé — à valider",
  rejete: "Non retenu",
  valide_pret_envoi: "Contrat prêt à envoyer",
  contrat_envoye: "Contrat envoyé",
  en_attente_paiement: "En attente de paiement",
  active: "Actif (inscrit)",
};

const BLOC_LABELS: { key: keyof PersonneCasier["test"]; label: string }[] = [
  { key: "lexiqueScore", label: "Bloc 1 — Lexique & questions ouvertes" },
  { key: "essayScore", label: "Bloc 2 — Commentaire argumentatif" },
  { key: "situationsScore", label: "Bloc 3 — Mises en situation" },
  { key: "oralScore", label: "Bloc 4 — Compréhension orale" },
  { key: "videoScore", label: "Bloc 5 — Production vidéo" },
];

const COMPETENCY_LABELS = Object.fromEntries(COMPETENCY_DEFS.map((c) => [c.key, c.label]));

const MODELE_OPTIONS: { value: string; label: string }[] = [
  { value: "delf_dalf", label: "DELF/DALF" },
  { value: "tef", label: "TEF Canada" },
  { value: "dfp", label: "DFP" },
  { value: "postulant_prod", label: "Postulant production" },
];
const MODELE_LABELS = Object.fromEntries(MODELE_OPTIONS.map((m) => [m.value, m.label]));
const CANAL_LABELS: Record<string, string> = { mail: "mail", whatsapp: "WhatsApp" };

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-white/10 bg-obsidianCard p-6">
      <h3 className="font-display text-base font-semibold text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

// Fiche unifiée d'une personne, depuis le Cycle complet — union de tout ce
// qui la concerne (coordonnées, test bloc par bloc, contrat, paiement, et si
// applicable formation + production) en une seule page, plutôt que de
// forcer la RH à recouper plusieurs casiers séparés pour reconstituer le
// parcours d'un candidat. Voir RhService.getPersonneCasier.
export default function PersonneCasierPanel({ attemptId }: { attemptId: string }) {
  const [casier, setCasier] = useState<PersonneCasier | "loading" | "erreur">("loading");

  function refresh() {
    apiGet<PersonneCasier>(`/rh/cycle/${attemptId}`, adminHeaders())
      .then(setCasier)
      .catch(() => setCasier("erreur"));
  }

  useEffect(refresh, [attemptId]);

  if (casier === "loading") return <p className="font-sans text-sm text-white/50">Chargement...</p>;
  if (casier === "erreur")
    return <p className="font-sans text-sm text-white/50">Erreur de chargement.</p>;

  const presencesParSeance = new Map(
    (casier.formation?.historiquePresences ?? []).map((p) => [p.seanceNumero, p])
  );

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg font-semibold text-white">
                {casier.candidat.firstName} {casier.candidat.lastName}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-xs text-white/50">
                <span>{casier.candidat.email}</span>
                <span>{casier.candidat.phone}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="rounded-full border border-accent/40 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-accent">
                {STATUS_LABELS[casier.test.statut] ?? casier.test.statut}
              </span>
              <p className="mt-1 font-mono text-[11px] text-white/40">
                Candidature reçue le {fmtDate(casier.candidat.coordonneesRecuesLe)}
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={20}>
        <Section title="Résultat du test">
          <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {BLOC_LABELS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className="font-sans text-xs text-white/60">{label}</span>
                <span className="shrink-0 font-mono text-xs text-white/80">
                  {(casier.test[key] as number | null) ?? "—"}/20
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 border-t border-white/10 pt-3 font-mono text-xs text-accent">
            Total : {casier.test.totalScore ?? "—"}/100 — {casier.test.tier ?? "—"}
          </p>
          <p className="mt-1 font-mono text-[11px] text-white/40">
            Soumis le {fmtDate(casier.test.submittedAt)}
            {casier.test.gradedAt && ` · Corrigé le ${fmtDate(casier.test.gradedAt)}`}
          </p>

          {casier.test.gradedAt && (
            <EnvoyerResultatsForm
              attemptId={attemptId}
              phone={casier.candidat.phone}
              resultats={casier.resultats}
              onSent={refresh}
            />
          )}
        </Section>
      </Reveal>

      {(casier.contrat.duree || casier.contrat.envoyeLe) && (
        <Reveal delay={30}>
          <Section title="Contrat">
            <div className="grid gap-3 sm:grid-cols-2">
              <p className="font-sans text-sm text-white/80">
                Durée : <span className="text-white">{casier.contrat.duree ?? "—"}</span>
              </p>
              <p className="font-sans text-sm text-white/80">
                Frais : <span className="text-white">{casier.contrat.frais ?? "—"}</span>
              </p>
            </div>
            {casier.contrat.conditions && (
              <p className="mt-2 font-sans text-xs text-white/60">{casier.contrat.conditions}</p>
            )}
            <p className="mt-2 font-mono text-[11px] text-white/40">
              {casier.contrat.envoyeLe ? `Envoyé le ${fmtDate(casier.contrat.envoyeLe)}` : "Pas encore envoyé"}
            </p>
          </Section>
        </Reveal>
      )}

      {(casier.paiement.reference || casier.paiement.confirmeLe) && (
        <Reveal delay={35}>
          <Section title="Paiement">
            <p className="font-sans text-sm text-white/80">
              Référence : <span className="text-white">{casier.paiement.reference ?? "—"}</span>
            </p>
            <p className="mt-1 font-mono text-[11px] text-white/40">
              {casier.paiement.confirmeLe
                ? `Confirmé le ${fmtDate(casier.paiement.confirmeLe)}`
                : "En attente de confirmation"}
            </p>
          </Section>
        </Reveal>
      )}

      {casier.formation && (
        <Reveal delay={40}>
          <Section title="Formation">
            <div className="grid gap-3 text-sm text-white/80 sm:grid-cols-3">
              <p>
                Groupe : <span className="text-white">{casier.formation.groupeLabel}</span>
                {casier.formation.typeCours && (
                  <span className="text-white/50"> ({casier.formation.typeCours})</span>
                )}
              </p>
              <p>
                Formateur : <span className="text-white">{casier.formation.formateurNom ?? "—"}</span>
              </p>
              <p>
                Abonnement :{" "}
                <span className="text-white">
                  {casier.formation.abonnementExpireAt
                    ? `expire le ${fmtDate(casier.formation.abonnementExpireAt)}`
                    : "non défini"}
                </span>
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {casier.formation.historiqueNotations.map((s) => {
                const graded = s.notations.filter((n) => n.scoreOn20 !== null);
                const presence = presencesParSeance.get(s.numero);
                if (graded.length === 0 && !presence) return null;
                return (
                  <div key={s.numero} className="rounded border border-white/10 bg-obsidian p-3">
                    <p className="font-mono text-xs uppercase tracking-widest text-accent">
                      Séance {s.numero}
                      {s.startAt && ` — ${fmtDate(s.startAt)}`}
                      {presence && <span className="ml-2 text-success">Présent</span>}
                    </p>
                    {graded.length > 0 && (
                      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                        {graded.map((n) => (
                          <p key={n.id} className="font-sans text-xs text-white/70">
                            {COMPETENCY_LABELS[n.competence] ?? n.competence} :{" "}
                            <span className="text-white">{n.scoreOn20}/20</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {casier.formation.historiqueNotations.every(
                (s) => s.notations.every((n) => n.scoreOn20 === null) && !presencesParSeance.get(s.numero)
              ) && <p className="font-sans text-xs text-white/50">Aucune séance notée pour l&apos;instant.</p>}
            </div>
          </Section>
        </Reveal>
      )}

      {casier.production.length > 0 && (
        <Reveal delay={60}>
          <Section title="Production">
            <div className="space-y-2">
              {casier.production.map((m, i) => (
                <div key={i} className="rounded border border-white/10 bg-obsidian p-3">
                  <p className="font-sans text-sm text-white">
                    {m.clientNom}
                    {m.dateFin === null && (
                      <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-success">
                        Active
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-white/50">
                    {m.role} · {m.superviseurNom ?? "Sans superviseur"}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-white/40">
                    {fmtDate(m.dateDebut)} → {fmtDate(m.dateFin)}
                    {m.qualityScore !== null && ` · QS ${m.qualityScore}/5`}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </Reveal>
      )}
    </div>
  );
}

// Envoi des résultats au candidat — indépendant de l'envoi du contrat
// (section "Contrat" plus haut) : la RH peut prévenir le candidat de son
// résultat avant même que le contrat soit prêt. Le mail part réellement
// (Resend, voir RhService.envoyerResultatsCandidat) ; WhatsApp n'a pas
// d'API payante branchée, donc le bouton ouvre juste un lien wa.me
// pré-rempli que la RH envoie elle-même.
function EnvoyerResultatsForm({
  attemptId,
  phone,
  resultats,
  onSent,
}: {
  attemptId: string;
  phone: string;
  resultats: PersonneCasier["resultats"];
  onSent: () => void;
}) {
  const [modele, setModele] = useState(resultats.modele ?? "delf_dalf");
  const [status, setStatus] = useState<"idle" | "sending-mail" | "sending-whatsapp" | "error">(
    "idle"
  );

  async function envoyer(canal: "mail" | "whatsapp") {
    setStatus(canal === "mail" ? "sending-mail" : "sending-whatsapp");
    try {
      const res = await apiPostAuthed<{ waLink?: string }>(
        `/rh/cycle/${attemptId}/envoyer-resultats`,
        { canal, modele },
        adminHeaders()
      );
      if (canal === "whatsapp" && res.waLink) {
        window.open(res.waLink, "_blank", "noopener,noreferrer");
      }
      setStatus("idle");
      onSent();
    } catch {
      setStatus("error");
    }
  }

  const sending = status === "sending-mail" || status === "sending-whatsapp";

  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <p className="font-mono text-xs uppercase tracking-widest text-white/50">
        Envoyer les résultats au candidat
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <select
          value={modele}
          onChange={(e) => setModele(e.target.value)}
          className="rounded border border-white/20 bg-obsidian px-3 py-1.5 font-sans text-sm text-white outline-none focus:border-accent"
        >
          {MODELE_OPTIONS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <Button variant="ghostDark" onClick={() => envoyer("mail")} disabled={sending}>
          {status === "sending-mail" ? "Envoi..." : "Envoyer par mail"}
        </Button>
        <Button variant="ghostDark" onClick={() => envoyer("whatsapp")} disabled={sending}>
          {status === "sending-whatsapp" ? "Ouverture..." : "Envoyer par WhatsApp"}
        </Button>
      </div>
      {status === "error" && (
        <p className="mt-2 font-mono text-xs text-accent">Échec de l&apos;envoi — réessayer.</p>
      )}
      {resultats.envoyesLe && (
        <p className="mt-2 font-mono text-[11px] text-white/40">
          Dernier envoi : {fmtDate(resultats.envoyesLe)} par{" "}
          {resultats.canal ? CANAL_LABELS[resultats.canal] ?? resultats.canal : "—"}
          {resultats.modele && ` — modèle ${MODELE_LABELS[resultats.modele] ?? resultats.modele}`}
        </p>
      )}
      <p className="mt-1 font-mono text-[11px] text-white/30">Téléphone : {phone}</p>
    </div>
  );
}
