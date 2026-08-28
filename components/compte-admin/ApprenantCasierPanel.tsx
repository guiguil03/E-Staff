"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet, apiPut } from "@/lib/api";
import { COMPETENCY_DEFS } from "@/components/compte-formateur/gradingGrids";
import { adminHeaders } from "./adminHeaders";

interface Notation {
  id: string;
  competence: string;
  fileName: string | null;
  soumisAt: string | null;
  note: number | null;
  commentaires: string | null;
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

interface ApprenantCasier {
  matricule: string;
  prenom: string;
  nom: string;
  email: string;
  groupeLabel: string;
  typeCours: string | null;
  formateurNom: string | null;
  abonnementExpireAt: string | null;
  tracabilite: {
    connecteurId: string | null;
    connecteurNom: string | null;
    sourceRecrutement: string | null;
    statutAgent: string;
  };
  coordonneesPaiement: {
    ribOuMobileMoney: string | null;
    moyenPaiementType: string | null;
    verifieLe: string | null;
  };
  admission: { totalScore: number | null; tier: string | null; gradedAt: string | null } | null;
  historiqueNotations: SeanceNotations[];
  historiquePresences: Presence[];
  historiqueMissions: MissionHistorique[];
}

interface Apporteur {
  id: string;
  firstName: string;
  lastName: string;
}

const COMPETENCY_LABELS = Object.fromEntries(COMPETENCY_DEFS.map((c) => [c.key, c.label]));

const STATUT_AGENT_LABELS: Record<string, string> = {
  formation: "En formation",
  essai: "Période d'essai",
  actif: "Actif en production",
  inactif: "Démissionné / Inactif",
};

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
}

// Casier apprenant côté RH — historique réel (notations + présences, déjà
// tracées via le Cockpit Formateur) plutôt qu'un journal fabriqué. Réutilise
// NotationService.listApprenantNotations (voir RhService.getApprenantCasier)
// au lieu de dupliquer la logique.
export default function ApprenantCasierPanel({ matricule }: { matricule: string }) {
  const [casier, setCasier] = useState<ApprenantCasier | "loading" | "erreur">("loading");
  const [apporteurs, setApporteurs] = useState<Apporteur[]>([]);

  function refresh() {
    apiGet<ApprenantCasier>(`/rh/apprenants/${matricule}/casier`, adminHeaders())
      .then(setCasier)
      .catch(() => setCasier("erreur"));
  }

  useEffect(refresh, [matricule]);

  useEffect(() => {
    apiGet<Apporteur[]>("/rh/partenaires", adminHeaders())
      .then(setApporteurs)
      .catch(() => {});
  }, []);

  if (casier === "loading") return <p className="font-sans text-sm text-white/50">Chargement...</p>;
  if (casier === "erreur")
    return <p className="font-sans text-sm text-white/50">Erreur de chargement.</p>;

  const presencesParSeance = new Map(casier.historiquePresences.map((p) => [p.seanceNumero, p]));

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <p className="font-display text-lg font-semibold text-white">
            {casier.prenom} {casier.nom}
          </p>
          <p className="font-mono text-xs text-white/40">
            {casier.matricule} · {casier.email}
          </p>
          <div className="mt-3 grid gap-3 border-t border-white/10 pt-3 text-sm text-white/80 sm:grid-cols-3">
            <p>
              Groupe : <span className="text-white">{casier.groupeLabel}</span>
              {casier.typeCours && <span className="text-white/50"> ({casier.typeCours})</span>}
            </p>
            <p>Formateur : <span className="text-white">{casier.formateurNom ?? "—"}</span></p>
            <p>
              Abonnement :{" "}
              <span className="text-white">
                {casier.abonnementExpireAt
                  ? `expire le ${fmtDate(casier.abonnementExpireAt)}`
                  : "non défini"}
              </span>
            </p>
          </div>
          {casier.admission && (
            <p className="mt-2 font-mono text-xs text-accent">
              Admission : {casier.admission.totalScore ?? "—"}/100 — {casier.admission.tier} (
              {fmtDate(casier.admission.gradedAt)})
            </p>
          )}
        </div>
      </Reveal>

      <Reveal delay={10}>
        <TracabilitePaiementSection
          matricule={casier.matricule}
          tracabilite={casier.tracabilite}
          coordonneesPaiement={casier.coordonneesPaiement}
          apporteurs={apporteurs}
          onSaved={refresh}
        />
      </Reveal>

      {casier.historiqueMissions.length > 0 && (
        <Reveal delay={20}>
          <div className="rounded border border-white/10 bg-obsidianCard p-6">
            <h3 className="font-display text-base font-semibold text-white">
              Historique des missions (Production)
            </h3>
            <div className="mt-4 space-y-2">
              {casier.historiqueMissions.map((m, i) => (
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
          </div>
        </Reveal>
      )}

      <Reveal delay={40}>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <h3 className="font-display text-base font-semibold text-white">
            Historique des notations
          </h3>
          <div className="mt-4 space-y-3">
            {casier.historiqueNotations.map((s) => {
              const graded = s.notations.filter((n) => n.scoreOn20 !== null);
              const presence = presencesParSeance.get(s.numero);
              if (graded.length === 0 && !presence) return null;
              return (
                <div key={s.numero} className="rounded border border-white/10 bg-obsidian p-3">
                  <p className="font-mono text-xs uppercase tracking-widest text-accent">
                    Séance {s.numero}
                    {s.startAt && ` — ${fmtDate(s.startAt)}`}
                    {presence && (
                      <span className="ml-2 text-success">
                        Présent
                        {presence.dureeSecondes
                          ? ` (${Math.round(presence.dureeSecondes / 60)} min)`
                          : ""}
                      </span>
                    )}
                  </p>
                  {graded.length > 0 ? (
                    <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                      {graded.map((n) => (
                        <p key={n.id} className="font-sans text-xs text-white/70">
                          {COMPETENCY_LABELS[n.competence] ?? n.competence} :{" "}
                          <span className="text-white">{n.scoreOn20}/20</span>
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 font-sans text-xs text-white/40">Pas encore noté.</p>
                  )}
                </div>
              );
            })}
            {casier.historiqueNotations.every(
              (s) => s.notations.every((n) => n.scoreOn20 === null) && !presencesParSeance.get(s.numero)
            ) && <p className="font-sans text-sm text-white/50">Aucune séance notée pour l&apos;instant.</p>}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function TracabilitePaiementSection({
  matricule,
  tracabilite,
  coordonneesPaiement,
  apporteurs,
  onSaved,
}: {
  matricule: string;
  tracabilite: ApprenantCasier["tracabilite"];
  coordonneesPaiement: ApprenantCasier["coordonneesPaiement"];
  apporteurs: Apporteur[];
  onSaved: () => void;
}) {
  const [connecteurId, setConnecteurId] = useState(tracabilite.connecteurId ?? "");
  const [sourceRecrutement, setSourceRecrutement] = useState(tracabilite.sourceRecrutement ?? "");
  const [statutAgent, setStatutAgent] = useState(tracabilite.statutAgent);
  const [moyenPaiementType, setMoyenPaiementType] = useState(
    coordonneesPaiement.moyenPaiementType ?? ""
  );
  const [ribOuMobileMoney, setRibOuMobileMoney] = useState(
    coordonneesPaiement.ribOuMobileMoney ?? ""
  );
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await apiPut(
        `/rh/apprenants/${matricule}`,
        {
          connecteurId: connecteurId || null,
          sourceRecrutement: sourceRecrutement.trim() || null,
          statutAgent,
          moyenPaiementType: moyenPaiementType || null,
          ribOuMobileMoney: ribOuMobileMoney.trim() || null,
        },
        adminHeaders()
      );
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded border border-white/10 bg-obsidianCard p-6">
      <h3 className="font-display text-base font-semibold text-white">
        Traçabilité &amp; coordonnées de paiement
      </h3>
      <p className="mt-1 font-mono text-[11px] text-white/40">
        Base des commissions apporteurs et de l&apos;affichage automatique des coordonnées de
        paiement sur les bulletins.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
            Apporteur d&apos;affaires
          </label>
          <select
            value={connecteurId}
            onChange={(e) => setConnecteurId(e.target.value)}
            className="mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
          >
            <option value="">— Aucun (candidature directe) —</option>
            {apporteurs.map((a) => (
              <option key={a.id} value={a.id}>
                {a.firstName} {a.lastName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
            Source de recrutement
          </label>
          <input
            value={sourceRecrutement}
            onChange={(e) => setSourceRecrutement(e.target.value)}
            placeholder="Ex. Réseau, candidature spontanée..."
            className="mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
            Statut agent
          </label>
          <select
            value={statutAgent}
            onChange={(e) => setStatutAgent(e.target.value)}
            className="mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
          >
            {Object.entries(STATUT_AGENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <p className="mt-1 font-mono text-[10px] text-white/40">
            Contrôle si la commission récurrente de l&apos;apporteur court toujours.
          </p>
        </div>
        <div />
        <div>
          <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
            Moyen de paiement
          </label>
          <select
            value={moyenPaiementType}
            onChange={(e) => setMoyenPaiementType(e.target.value)}
            className="mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
          >
            <option value="">— Non renseigné —</option>
            <option value="RIB">RIB</option>
            <option value="MVola">MVola</option>
            <option value="Orange Money">Orange Money</option>
            <option value="Airtel Money">Airtel Money</option>
          </select>
        </div>
        <div>
          <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
            Numéro / RIB
          </label>
          <input
            value={ribOuMobileMoney}
            onChange={(e) => setRibOuMobileMoney(e.target.value)}
            placeholder="Numéro Mobile Money ou RIB"
            className="mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
          />
        </div>
      </div>

      {coordonneesPaiement.verifieLe && (
        <p className="mt-3 font-mono text-[11px] text-success">
          Coordonnées vérifiées le {fmtDate(coordonneesPaiement.verifieLe)}
        </p>
      )}

      <div className="mt-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded border border-accent px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-accent hover:bg-accent/10 disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
