"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiDelete, apiGet, apiPostAuthed } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface MissionHistorique {
  agentNom: string;
  agentMatricule: string;
  clientNom: string;
  role: string;
  dateDebut: string;
  dateFin: string | null;
  qualityScore: number | null;
}

interface SuperviseurCasier {
  matricule: string;
  prenom: string;
  nom: string;
  email: string;
  missions: MissionHistorique[];
}

interface Absence {
  id: string;
  jour: string;
  heures: number;
  justifiee: boolean;
  motif: string | null;
}

const inputClass =
  "w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-accent";
const labelClass = "font-mono text-[11px] uppercase tracking-widest text-white/40";

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
}

// Casier superviseur côté RH — historique complet des agents supervisés
// (voir ProductionService.getSuperviseurCasier), missions actives et
// terminées confondues.
export default function SuperviseurCasierPanel({ id }: { id: string }) {
  const [casier, setCasier] = useState<SuperviseurCasier | "loading" | "erreur">("loading");
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [absence, setAbsence] = useState({
    jour: new Date().toISOString().slice(0, 10),
    heures: "8",
    justifiee: false,
    motif: "",
  });
  const [info, setInfo] = useState<{ type: "ok" | "erreur"; texte: string } | null>(null);
  const [busy, setBusy] = useState(false);

  function chargerAbsences() {
    apiGet<Absence[]>(`/superviseurs/${id}/absences`, adminHeaders())
      .then(setAbsences)
      .catch(() => setAbsences([]));
  }

  async function envoyerIdentifiants() {
    if (!window.confirm("Générer un nouveau mot de passe et l'envoyer par e-mail au superviseur ?")) return;
    setBusy(true);
    setInfo(null);
    try {
      const r = await apiPostAuthed<{ emailEnvoye: boolean }>(
        `/superviseurs/${id}/regenerer-identifiants`,
        {},
        adminHeaders()
      );
      setInfo({
        type: r.emailEnvoye ? "ok" : "erreur",
        texte: r.emailEnvoye
          ? "Identifiants envoyés par e-mail."
          : "Mot de passe régénéré, mais l'e-mail n'a pas pu partir (fournisseur d'e-mail non configuré ?).",
      });
    } catch (e) {
      setInfo({ type: "erreur", texte: e instanceof Error ? e.message : "Échec de l'envoi." });
    } finally {
      setBusy(false);
    }
  }

  async function ajouterAbsence() {
    setBusy(true);
    setInfo(null);
    try {
      await apiPostAuthed(
        `/superviseurs/${id}/absences`,
        {
          jour: absence.jour,
          heures: Number(absence.heures),
          justifiee: absence.justifiee,
          motif: absence.motif.trim() || null,
        },
        adminHeaders()
      );
      setAbsence({ ...absence, motif: "" });
      chargerAbsences();
    } catch (e) {
      setInfo({ type: "erreur", texte: e instanceof Error ? e.message : "Échec de l'enregistrement." });
    } finally {
      setBusy(false);
    }
  }

  async function supprimerAbsence(absenceId: string) {
    setBusy(true);
    try {
      await apiDelete(`/superviseurs/absences/${absenceId}`, adminHeaders());
      chargerAbsences();
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    apiGet<SuperviseurCasier>(`/production/superviseurs/${id}/casier`, adminHeaders())
      .then(setCasier)
      .catch(() => setCasier("erreur"));
    chargerAbsences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (casier === "loading") return <p className="font-sans text-sm text-white/50">Chargement...</p>;
  if (casier === "erreur")
    return <p className="font-sans text-sm text-white/50">Erreur de chargement.</p>;

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
        </div>
      </Reveal>

      <Reveal delay={20}>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <h3 className="font-display text-base font-semibold text-white">Espace Superviseur</h3>
          <p className="mt-1 font-sans text-xs text-white/50">
            Génère un mot de passe temporaire et l&apos;envoie par e-mail ({casier.email}). À utiliser pour
            créer l&apos;accès comme pour le réinitialiser.
          </p>
          <button
            onClick={envoyerIdentifiants}
            disabled={busy}
            className="mt-3 rounded bg-accent px-4 py-2 font-sans text-sm font-semibold text-obsidian disabled:opacity-40"
          >
            ✉ Envoyer / régénérer les identifiants
          </button>
          {info && (
            <p className={`mt-2 font-sans text-sm ${info.type === "ok" ? "text-success" : "text-statusRed"}`}>
              {info.texte}
            </p>
          )}
        </div>
      </Reveal>

      <Reveal delay={30}>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <h3 className="font-display text-base font-semibold text-white">Absences</h3>
          <p className="mt-1 font-sans text-xs text-white/50">
            Les heures non justifiées sont retenues sur sa paie (400 € / 160 h = 2,50 € de l&apos;heure).
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className={labelClass} htmlFor="abs-jour">Jour</label>
              <input id="abs-jour" type="date" className={`mt-1 ${inputClass}`} value={absence.jour}
                onChange={(e) => setAbsence({ ...absence, jour: e.target.value })} />
            </div>
            <div>
              <label className={labelClass} htmlFor="abs-heures">Heures</label>
              <input id="abs-heures" type="number" min={0.25} max={24} step="0.25" className={`mt-1 ${inputClass}`}
                value={absence.heures} onChange={(e) => setAbsence({ ...absence, heures: e.target.value })} />
            </div>
            <div className="lg:col-span-2">
              <label className={labelClass} htmlFor="abs-motif">Motif</label>
              <input id="abs-motif" maxLength={300} className={`mt-1 ${inputClass}`} value={absence.motif}
                onChange={(e) => setAbsence({ ...absence, motif: e.target.value })} />
            </div>
            <label className="flex items-end gap-2 pb-2 font-sans text-sm text-white/80">
              <input type="checkbox" checked={absence.justifiee}
                onChange={(e) => setAbsence({ ...absence, justifiee: e.target.checked })} />
              Justifiée
            </label>
          </div>
          <button
            onClick={ajouterAbsence}
            disabled={busy || !absence.jour || Number(absence.heures) <= 0}
            className="mt-3 rounded border border-white/20 px-4 py-2 font-sans text-sm text-white hover:border-accent hover:text-accent disabled:opacity-40"
          >
            Enregistrer l&apos;absence
          </button>
          {absences.length > 0 && (
            <ul className="mt-4 divide-y divide-white/5">
              {absences.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <p className="font-sans text-sm text-white/80">
                    <span className="font-mono text-xs text-white/50">{fmtDate(a.jour)}</span> · {a.heures} h ·{" "}
                    <span className={a.justifiee ? "text-success" : "text-statusRed"}>
                      {a.justifiee ? "justifiée" : "non justifiée"}
                    </span>
                    {a.motif && <span className="text-white/50"> — {a.motif}</span>}
                  </p>
                  <button onClick={() => supprimerAbsence(a.id)} disabled={busy}
                    className="font-mono text-[11px] uppercase tracking-widest text-white/40 hover:text-accent disabled:opacity-40">
                    Supprimer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Reveal>

      <Reveal delay={40}>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <h3 className="font-display text-base font-semibold text-white">Agents supervisés</h3>
          <div className="mt-4 space-y-2">
            {casier.missions.length === 0 && (
              <p className="font-sans text-sm text-white/50">Aucun agent supervisé pour l&apos;instant.</p>
            )}
            {casier.missions.map((m, i) => (
              <div key={i} className="rounded border border-white/10 bg-obsidian p-3">
                <p className="font-sans text-sm text-white">
                  {m.agentNom}
                  <span className="ml-2 font-mono text-[11px] text-white/40">{m.agentMatricule}</span>
                  {m.dateFin === null && (
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-success">
                      Active
                    </span>
                  )}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-white/50">
                  {m.role} · {m.clientNom}
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
    </div>
  );
}
