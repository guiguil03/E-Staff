"use client";

import { useCallback, useEffect, useState } from "react";
import { apiDelete, apiGet, apiGetBlob, apiPost, apiPut } from "@/lib/api";
import { agentMatricule as matriculeSession, fmtDate, fmtHeures } from "../compte-agent/agentApi";

type Alerte = "rouge" | "orange" | "vert";

interface LigneEquipe {
  id: string;
  matricule: string;
  nom: string;
  contratId: string;
  courbeSemaine: (number | null)[];
  clientNom: string;
  statutPresence: string;
  tauxMoyenMois: number | null;
  alerte: Alerte | null;
  joursAValider: number;
  alerteOuverte: boolean;
}

interface Dashboard {
  superviseur: { matricule: string; prenom: string; nom: string };
  periode: string;
  contratId: string | null;
  kpis: { volumeHeuresMois: number; tempsPanneMois: number; agentsOrange: number; agentsRouge: number };
  courbeEquipe: { tauxMoyen: number | null; heures: number; alerte: Alerte | null }[];
  paieEquipe: {
    agentId: string;
    nom: string;
    base: number;
    retenues: number;
    semaines: { rang: number; etat: "acquise" | "perdue" | "en_cours"; montant: number }[];
    primes: number;
    net: number;
  }[];
  competences: { agentId: string; nom: string; totalScore: number | null; niveau: string | null }[];
  jaugeEquipe: { tauxMoyen: number | null; pourcentage: number | null; alerte: Alerte | null; agents: number };
  statuts: Record<string, number>;
  equipe: LigneEquipe[];
  aValider: {
    id: string;
    jour: string;
    agentNom: string;
    clientNom: string;
    heuresTravaillees: number;
    heuresPanne: number;
    realise: number | null;
    tauxAtteint: number;
    alerte: Alerte;
    remarques: string | null;
    statutValidation: string;
  }[];
  alertes: { id: string; agentNom: string; message: string | null; creeeLe: string }[];
  reunions: {
    aVenir: { id: string; titre: string; debut: string; dureeMin: number; type: string; participants: string[] }[];
    cetteSemaine: number;
    minParSemaine: number;
  };
  messages: { id: string; texte: string; createdAt: string; destinataire: string }[];
  clients: { id: string; clientNom: string }[];
  cartes: {
    periode: string;
    salaire: { base: number; heuresReference: number; tauxHoraire: number };
    primes: {
      semaines: {
        semaine: string;
        rang: number;
        agentsVerts: number;
        agentsTotal: number;
        etat: "acquise" | "perdue" | "en_cours";
        montant: number;
      }[];
      total: number;
      montantParSemaine: number;
      partRequise: number;
    };
    absences: { heures: number; retenues: number };
    net: number;
  };
}

// ---- Charte : fond obsidienne, or comme unique accent, statuts de la charte.
const PANEL = "rounded border border-white/10 bg-obsidianCard p-5";
const PANEL_TITLE = "font-display text-base font-bold uppercase tracking-wide text-white";
const LABEL = "font-mono text-[11px] uppercase tracking-widest text-white/40";
const INPUT =
  "w-full rounded border border-white/15 bg-obsidian px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none disabled:opacity-40";
const BTN = "rounded bg-accent px-4 py-2 font-sans text-sm font-semibold text-obsidian disabled:opacity-40";
const BTN_SM = "rounded bg-statusGreen px-3 py-1.5 font-sans text-xs font-semibold text-obsidian disabled:opacity-40";
const BTN_GHOST =
  "rounded border border-white/20 px-3 py-1.5 font-sans text-xs text-white/80 hover:border-accent hover:text-accent disabled:opacity-40";

const HEX: Record<Alerte, string> = { rouge: "#D8604F", orange: "#E0913A", vert: "#34A56F" };
const TEXTE: Record<Alerte, string> = {
  rouge: "text-statusRed",
  orange: "text-statusOrange",
  vert: "text-statusGreen",
};
const FOND: Record<Alerte, string> = {
  rouge: "bg-statusRed",
  orange: "bg-statusOrange",
  vert: "bg-statusGreen",
};

const STATUTS_LABELS: Record<string, { label: string; couleur: string }> = {
  en_ligne: { label: "En ligne", couleur: "bg-statusGreen" },
  en_pause: { label: "En pause", couleur: "bg-statusOrange" },
  en_formation: { label: "En formation", couleur: "bg-teal" },
  en_panne: { label: "En panne", couleur: "bg-statusRed" },
  hors_ligne: { label: "Hors ligne", couleur: "bg-white/30" },
};

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const fmtEuro = (n: number) =>
  `${n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
const fmtDateHeure = (iso: string) => new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
const messageErreur = (e: unknown) => (e instanceof Error ? e.message : "Une erreur est survenue.");

function niveau(taux: number | null): Alerte | null {
  if (taux === null) return null;
  return taux < 3 ? "rouge" : taux < 5 ? "orange" : "vert";
}

// Jauge en demi-cercle (moyenne taux d'objectifs de l'équipe).
function JaugeDemi({ pourcentage, alerte }: { pourcentage: number | null; alerte: Alerte | null }) {
  const longueur = Math.PI * 70;
  const p = pourcentage ?? 0;
  const couleur = alerte ? HEX[alerte] : "rgba(255,255,255,0.2)";
  return (
    <svg viewBox="0 0 160 100" className="mx-auto w-full max-w-[220px]" role="img" aria-label={`Moyenne d'objectifs ${p}%`}>
      <path d="M 10 85 A 70 70 0 0 1 150 85" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="13" strokeLinecap="round" />
      <path
        d="M 10 85 A 70 70 0 0 1 150 85"
        fill="none"
        stroke={couleur}
        strokeWidth="13"
        strokeLinecap="round"
        strokeDasharray={`${(p / 100) * longueur} ${longueur}`}
      />
      <text x="80" y="76" textAnchor="middle" fontSize="30" fontWeight="700" fill="#fff">
        {pourcentage === null ? "—" : `${pourcentage}%`}
      </text>
    </svg>
  );
}

// Barres : taux moyen de l'équipe par jour de la semaine.
function BarresSemaine({ jours }: { jours: Dashboard["courbeEquipe"] }) {
  const max = Math.max(6, ...jours.map((j) => j.tauxMoyen ?? 0));
  return (
    <div>
      <div className="flex h-28 items-end gap-2" role="img" aria-label="Évolution du taux hebdomadaire">
        {jours.map((j, i) => (
          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            {j.tauxMoyen !== null && (
              <span className="font-mono text-[10px] text-white/60">{j.tauxMoyen}</span>
            )}
            <div
              className={`w-full rounded-t ${j.alerte ? FOND[j.alerte] : "bg-white/10"}`}
              style={{ height: `${j.tauxMoyen === null ? 4 : Math.max(6, (j.tauxMoyen / max) * 80)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-2">
        {JOURS.map((j) => (
          <span key={j} className="flex-1 text-center font-mono text-[10px] uppercase text-white/40">
            {j}
          </span>
        ))}
      </div>
    </div>
  );
}

function Pastille({ alerte }: { alerte: Alerte | null }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-3 w-3 rounded-full ${alerte ? FOND[alerte] : "bg-white/20"}`}
    />
  );
}

export default function SuperviseurDashboard() {
  const [data, setData] = useState<Dashboard | "loading" | "erreur">("loading");
  const [contratId, setContratId] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [heure, setHeure] = useState(() => new Date());
  const matricule = matriculeSession();

  const [rechAgent, setRechAgent] = useState("");
  const [rechValid, setRechValid] = useState("");
  const [filtreValid, setFiltreValid] = useState<"tous" | "a_valider" | "a_corriger">("tous");
  const [commentaires, setCommentaires] = useState<Record<string, string>>({});

  const [message, setMessage] = useState({ texte: "", agentId: "" });
  const [reunion, setReunion] = useState({ titre: "", debut: "", dureeMin: "30", agentIds: [] as string[] });
  const [periodeRapport, setPeriodeRapport] = useState(new Date().toISOString().slice(0, 7));

  const charger = useCallback(() => {
    if (!matricule) {
      setData("erreur");
      return Promise.resolve();
    }
    const qs = contratId ? `?contratId=${encodeURIComponent(contratId)}` : "";
    return apiGet<Dashboard>(`/superviseurs/${matricule}/dashboard${qs}`)
      .then(setData)
      .catch(() => setData("erreur"));
  }, [matricule, contratId]);

  useEffect(() => {
    charger();
    const t = setInterval(charger, 30_000); // statuts en direct
    return () => clearInterval(t);
  }, [charger]);

  useEffect(() => {
    const t = setInterval(() => setHeure(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  async function action(fn: () => Promise<unknown>) {
    setErreur(null);
    setBusy(true);
    try {
      await fn();
      await charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setBusy(false);
    }
  }

  if (data === "loading") return <p className="font-sans text-sm text-white/50">Chargement...</p>;
  if (data === "erreur") {
    return <p className="font-sans text-sm text-white/50">Impossible de charger votre tableau de bord pour le moment.</p>;
  }

  const base = `/superviseurs/${matricule}`;
  const { cartes, kpis } = data;
  const nomEquipe = data.contratId
    ? (data.clients.find((c) => c.id === data.contratId)?.clientNom ?? "Équipe")
    : "Vue consolidée";

  const equipeFiltree = data.equipe.filter((a) => a.nom.toLowerCase().includes(rechAgent.toLowerCase()));
  const aValiderFiltre = data.aValider.filter(
    (j) =>
      j.agentNom.toLowerCase().includes(rechValid.toLowerCase()) &&
      (filtreValid === "tous" ||
        (filtreValid === "a_corriger" ? j.statutValidation === "a_corriger" : j.statutValidation !== "a_corriger"))
  );
  const totalEquipe = data.paieEquipe.reduce((s, p) => s + p.net, 0);

  function valider(id: string) {
    action(() => apiPut(`${base}/journees/${id}/validation`, { commentaire: commentaires[id]?.trim() || null }));
  }
  function renvoyer(id: string) {
    const motif = commentaires[id]?.trim();
    if (!motif) {
      setErreur("Pour renvoyer une saisie, indiquez dans le commentaire ce que l'agent doit corriger.");
      return;
    }
    action(() => apiPut(`${base}/journees/${id}/renvoi`, { commentaire: motif }));
  }

  async function ouvrirSalle(reunionId: string) {
    setErreur(null);
    const fenetre = window.open("", "_blank");
    try {
      const r = await apiPost<{ configured: boolean; url: string | null }>(`${base}/reunions/${reunionId}/salle`, {});
      if (r.url && fenetre) {
        fenetre.location.href = r.url;
      } else {
        fenetre?.close();
        setErreur(r.configured ? "Impossible d'ouvrir la salle." : "La salle virtuelle n'est pas encore activée sur la plateforme.");
      }
    } catch (e) {
      fenetre?.close();
      setErreur(messageErreur(e));
    }
  }

  async function genererRapport() {
    setErreur(null);
    try {
      const qs = new URLSearchParams({ periode: periodeRapport });
      if (data !== "loading" && data !== "erreur" && data.contratId) qs.set("contratId", data.contratId);
      const blob = await apiGetBlob(`${base}/reporting?${qs}`, {});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport-activite-${periodeRapport}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErreur(messageErreur(e));
    }
  }

  const verte = data.jaugeEquipe.alerte === "vert";

  return (
    <div className="space-y-4">
      {/* Sélecteur d'équipe */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-accent/40 bg-accent/10 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 font-display text-base font-bold text-accent">Sélecteur d&apos;équipe</span>
          <button
            onClick={() => setContratId("")}
            className={`rounded border px-3 py-1.5 font-sans text-sm transition-colors ${
              contratId === "" ? "border-accent bg-accent text-obsidian" : "border-white/20 text-white/70 hover:border-accent"
            }`}
          >
            Vue consolidée
          </button>
          {data.clients.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setContratId(c.id)}
              className={`relative rounded border px-3 py-1.5 font-sans text-sm transition-colors ${
                contratId === c.id ? "border-accent bg-accent text-obsidian" : "border-white/20 text-white/70 hover:border-accent"
              }`}
            >
              Équipe {String.fromCharCode(65 + i)} · {c.clientNom}
              {contratId === c.id && (
                <span className="absolute -top-2 right-1 rounded bg-statusGreen px-1.5 font-mono text-[9px] uppercase text-obsidian">
                  Active
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="text-right">
          <p className="font-sans text-sm font-semibold text-white">
            {data.superviseur.prenom} {data.superviseur.nom}
            <span className="ml-1 font-normal text-white/50">(Superviseur)</span>
          </p>
          <p className="font-mono text-[11px] text-white/50">
            🕒 {heure.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      {erreur && (
        <p className="rounded border border-statusRed/40 bg-statusRed/10 px-3 py-2 font-sans text-sm text-statusRed">{erreur}</p>
      )}

      {/* Bouton d'alerte : agents en demande d'assistance */}
      {data.alertes.length > 0 && (
        <div className="rounded border border-statusRed/50 bg-statusRed/10 p-5">
          <h3 className="font-display text-lg font-semibold text-statusRed">
            🚨 {data.alertes.length} agent{data.alertes.length > 1 ? "s ont" : " a"} besoin d&apos;assistance
          </h3>
          <ul className="mt-3 space-y-2">
            {data.alertes.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-sans text-sm text-white">
                  <span className="font-semibold">{a.agentNom}</span>
                  <span className="ml-2 font-mono text-xs text-white/50">{fmtDateHeure(a.creeeLe)}</span>
                  {a.message && <span className="block text-white/70">« {a.message} »</span>}
                </p>
                <button className={BTN_GHOST} disabled={busy} onClick={() => action(() => apiPost(`${base}/alertes/${a.id}/traiter`, {}))}>
                  Marquer comme pris en charge
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ligne 1 : indicateurs clés | performance individuelle */}
      <div className="grid gap-4 xl:grid-cols-2">
        <section className={PANEL}>
          <h3 className={PANEL_TITLE}>
            Indicateurs clés et alertes d&apos;équipe <span className="font-sans text-sm font-normal normal-case text-white/50">({nomEquipe})</span>
          </h3>
          <div className="mt-4 grid gap-3 md:grid-cols-[1.1fr_1.2fr_0.9fr]">
            <div className="rounded border border-white/10 bg-obsidian p-3 text-center">
              <p className={LABEL}>Moyenne taux d&apos;objectifs équipe</p>
              <JaugeDemi pourcentage={data.jaugeEquipe.pourcentage} alerte={data.jaugeEquipe.alerte} />
              <p className="font-sans text-xs text-white/60">
                {data.jaugeEquipe.tauxMoyen === null ? "Aucune saisie ce mois-ci" : `Taux moyen ${data.jaugeEquipe.tauxMoyen}%`}
              </p>
              <p className={`mt-2 flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-wide ${verte ? "text-statusGreen" : "text-white/50"}`}>
                <Pastille alerte={data.jaugeEquipe.alerte} />
                {verte ? "Règle de gouvernance : objectifs atteints" : "Règle de gouvernance"}
              </p>
            </div>

            <div className="rounded border border-white/10 bg-obsidian p-3">
              <p className={`${LABEL} text-center`}>Évolution taux hebdo.</p>
              <div className="mt-3">
                <BarresSemaine jours={data.courbeEquipe} />
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded border border-white/10 bg-obsidian p-3 text-center">
                <p className={LABEL}>Volume d&apos;heures</p>
                <p className="mt-1 font-display text-2xl font-bold text-white">{fmtHeures(kpis.volumeHeuresMois)}</p>
              </div>
              <div className="rounded border border-white/10 bg-obsidian p-3 text-center">
                <p className={LABEL}>Temps de panne total</p>
                <p className="mt-1 font-display text-2xl font-bold text-white">{fmtHeures(kpis.tempsPanneMois)}</p>
              </div>
              <div className="rounded border border-white/10 bg-obsidian p-3 text-center">
                <p className={LABEL}>Agents en alerte</p>
                <p className="mt-1 font-sans text-sm text-white">
                  <span className="text-statusOrange">● {kpis.agentsOrange} orange</span> /{" "}
                  <span className="text-statusRed">● {kpis.agentsRouge} rouge</span>
                </p>
              </div>
            </div>
          </div>
          {!verte && data.jaugeEquipe.alerte !== null && (
            <p className="mt-3 rounded border border-statusOrange/40 bg-statusOrange/10 px-3 py-2 font-sans text-xs text-statusOrange">
              ⚠ Jauge non verte : une explication RH &amp; Client est requise.
            </p>
          )}
        </section>

        <section className={PANEL}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className={PANEL_TITLE}>
              Performance individuelle agents{" "}
              <span className="font-sans text-sm font-normal normal-case text-white/50">({nomEquipe})</span>
            </h3>
            <input
              aria-label="Rechercher un agent"
              placeholder="🔍 Rechercher"
              className={`${INPUT} max-w-[190px]`}
              value={rechAgent}
              onChange={(e) => setRechAgent(e.target.value)}
            />
          </div>
          {equipeFiltree.length === 0 ? (
            <p className="mt-4 font-sans text-sm text-white/50">Aucun agent à afficher.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className={`${LABEL} py-2 pr-2`}>Agent</th>
                    <th className={`${LABEL} py-2 pr-2`}>Statut</th>
                    {JOURS.map((j) => (
                      <th key={j} className={`${LABEL} px-1 py-2 text-center`}>{j}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {equipeFiltree.map((a) => {
                    const st = STATUTS_LABELS[a.statutPresence] ?? STATUTS_LABELS.hors_ligne;
                    return (
                      <tr key={a.id} className="border-b border-white/5">
                        <td className="py-2 pr-2 font-sans text-sm text-white">
                          {a.nom} {a.alerteOuverte && <span title="Demande d'assistance">🚨</span>}
                          <span className="block font-mono text-[10px] text-white/40">{a.clientNom}</span>
                        </td>
                        <td className="py-2 pr-2">
                          <span className="flex items-center gap-1.5 font-sans text-xs text-white/70">
                            <span className={`h-3 w-3 rounded-full ${st.couleur}`} aria-hidden />
                            {st.label}
                          </span>
                        </td>
                        {a.courbeSemaine.map((v, i) => {
                          const n = niveau(v);
                          return (
                            <td key={i} className="px-1 py-2 text-center">
                              {v === null ? (
                                <span className="text-white/20">—</span>
                              ) : (
                                <span
                                  className={`inline-block min-w-[2.4rem] rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold text-obsidian ${FOND[n!]}`}
                                >
                                  {v}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            <input
              type="month"
              aria-label="Mois du rapport"
              className={`${INPUT} max-w-[160px]`}
              value={periodeRapport}
              onChange={(e) => setPeriodeRapport(e.target.value)}
            />
            <button className={BTN_GHOST} onClick={genererRapport} disabled={!periodeRapport}>
              ⬇ Générer rapport
            </button>
          </div>
        </section>
      </div>

      {/* Ligne 2 : validation | vue financière */}
      <div className="grid gap-4 xl:grid-cols-2">
        <section className={PANEL}>
          <h3 className={PANEL_TITLE}>Tableau de validation des saisies journalières</h3>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              aria-label="Filtrer les saisies"
              className={`${INPUT} max-w-[180px]`}
              value={filtreValid}
              onChange={(e) => setFiltreValid(e.target.value as typeof filtreValid)}
            >
              <option value="tous">Filtres : toutes</option>
              <option value="a_valider">À valider</option>
              <option value="a_corriger">Renvoyées</option>
            </select>
            <input
              aria-label="Rechercher une saisie"
              placeholder="🔍 Rechercher"
              className={`${INPUT} max-w-[190px]`}
              value={rechValid}
              onChange={(e) => setRechValid(e.target.value)}
            />
          </div>
          {aValiderFiltre.length === 0 ? (
            <p className="mt-4 font-sans text-sm text-white/50">Rien à valider pour l&apos;instant. 👍</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    {["Date", "Agent", "Heures", "Pannes", "Ventes", "Taux", "Alerte", "Commentaire", "Action"].map((h) => (
                      <th key={h} className={`${LABEL} py-2 pr-2`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {aValiderFiltre.map((j) => (
                    <tr
                      key={j.id}
                      className={`border-b border-white/5 ${
                        j.alerte === "orange" ? "bg-statusOrange/10" : j.alerte === "rouge" ? "bg-statusRed/10" : ""
                      }`}
                    >
                      <td className="py-2 pr-2 font-mono text-xs text-white/70">{fmtDate(j.jour)}</td>
                      <td className="py-2 pr-2 font-sans text-sm text-white">
                        {j.agentNom}
                        {j.statutValidation === "a_corriger" && (
                          <span className="ml-1 font-mono text-[10px] uppercase text-statusOrange">renvoyée</span>
                        )}
                        {j.remarques && <span className="block font-sans text-[11px] italic text-white/50">« {j.remarques} »</span>}
                      </td>
                      <td className="py-2 pr-2 font-sans text-sm text-white">{fmtHeures(j.heuresTravaillees)}</td>
                      <td className="py-2 pr-2 font-sans text-sm text-white">{fmtHeures(j.heuresPanne)}</td>
                      <td className="py-2 pr-2 font-sans text-sm text-white">{j.realise ?? "—"}</td>
                      <td className={`py-2 pr-2 font-sans text-sm ${TEXTE[j.alerte]}`}>{j.tauxAtteint}%</td>
                      <td className="py-2 pr-2"><Pastille alerte={j.alerte} /></td>
                      <td className="py-2 pr-2">
                        <input
                          aria-label={`Commentaire pour ${j.agentNom}`}
                          maxLength={500}
                          placeholder={j.alerte === "vert" ? "" : "Motif / note…"}
                          className={`${INPUT} min-w-[150px] py-1.5 text-xs`}
                          value={commentaires[j.id] ?? ""}
                          onChange={(e) => setCommentaires({ ...commentaires, [j.id]: e.target.value })}
                        />
                      </td>
                      <td className="py-2">
                        <div className="flex gap-1.5">
                          <button className={BTN_SM} disabled={busy} onClick={() => valider(j.id)}>Valider</button>
                          <button className={BTN_GHOST} disabled={busy} onClick={() => renvoyer(j.id)}>Renvoyer</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={PANEL}>
          <h3 className={PANEL_TITLE}>
            Vue financière et paie consolidée{" "}
            <span className="font-sans text-sm font-normal normal-case text-white/50">({nomEquipe})</span>
          </h3>
          {data.paieEquipe.length === 0 ? (
            <p className="mt-4 font-sans text-sm text-white/50">Aucun agent à afficher.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className={`${LABEL} py-2 pr-2`}>Agents</th>
                    <th className={`${LABEL} py-2 pr-2`}>Salaire base</th>
                    <th className={`${LABEL} py-2 pr-2`}>Retenues pannes</th>
                    {[1, 2, 3, 4].map((n) => (
                      <th key={n} className={`${LABEL} py-2 pr-2`}>Bonus vert S{n}</th>
                    ))}
                    <th className={`${LABEL} py-2 pr-2`}>Primes</th>
                    <th className={`${LABEL} py-2`}>Total à recevoir</th>
                  </tr>
                </thead>
                <tbody>
                  {data.paieEquipe.map((p) => (
                    <tr key={p.agentId} className="border-b border-white/5">
                      <td className="py-2 pr-2 font-sans text-sm text-white">{p.nom}</td>
                      <td className="py-2 pr-2 font-sans text-sm text-white">{fmtEuro(p.base)}</td>
                      <td className="py-2 pr-2 font-sans text-sm text-statusRed">{p.retenues > 0 ? `−${fmtEuro(p.retenues)}` : "—"}</td>
                      {[1, 2, 3, 4].map((n) => {
                        const w = p.semaines.find((x) => x.rang === n);
                        return (
                          <td key={n} className="py-2 pr-2 font-sans text-sm">
                            {!w ? (
                              <span className="text-white/25">—</span>
                            ) : w.etat === "acquise" ? (
                              <span className="text-statusGreen">{fmtEuro(w.montant)}</span>
                            ) : w.etat === "perdue" ? (
                              <span className="text-statusRed">0 €</span>
                            ) : (
                              <span className="text-white/40">⏳</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2 pr-2 font-sans text-sm text-white">{fmtEuro(p.primes)}</td>
                      <td className="py-2 font-sans text-sm font-bold text-accent">{fmtEuro(p.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-right font-sans text-sm font-semibold text-white">
            Total équipe : <span className="text-accent">{fmtEuro(totalEquipe)}</span>
          </p>
        </section>
      </div>

      {/* Ligne 3 : suivi RH | ma rémunération */}
      <div className="grid gap-4 xl:grid-cols-2">
        <section className={PANEL}>
          <h3 className={PANEL_TITLE}>Suivi RH et compétences</h3>
          {data.competences.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-white/50">Aucun agent à afficher.</p>
          ) : (
            <ul className="mt-3 divide-y divide-white/5">
              {data.competences.map((c) => (
                <li key={c.agentId} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="font-sans text-sm text-white">{c.nom}</span>
                  <span className="font-sans text-xs text-white/60">
                    {c.totalScore === null ? (
                      "Aucun test rattaché"
                    ) : (
                      <>
                        Test de niveau initial : <span className="font-semibold text-accent">{c.totalScore}</span>
                        {c.niveau ? ` · ${c.niveau}` : ""}
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <a href="#reunions" className={`${BTN_GHOST} mt-3 inline-block`}>📅 Calendrier des réunions</a>
        </section>

        <section className={PANEL}>
          <h3 className={PANEL_TITLE}>Ma rémunération</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded border border-white/10 bg-obsidian p-3">
              <p className={LABEL}>Salaire de base</p>
              <p className="mt-1 font-display text-xl font-bold text-accent">{fmtEuro(cartes.salaire.base)}</p>
              <p className="font-sans text-[11px] text-white/50">{cartes.salaire.heuresReference} h · {fmtEuro(cartes.salaire.tauxHoraire)}/h</p>
            </div>
            <div className="rounded border border-white/10 bg-obsidian p-3">
              <p className={LABEL}>Primes hebdomadaires</p>
              <p className="mt-1 font-display text-xl font-bold text-accent">+ {fmtEuro(cartes.primes.total)}</p>
              <div className="font-sans text-[11px] text-white/50">
                {cartes.primes.semaines.length === 0
                  ? "Aucune semaine saisie."
                  : cartes.primes.semaines.map((s) => (
                      <p key={s.semaine}>
                        S{s.rang} : {s.agentsVerts}/{s.agentsTotal} au vert{" "}
                        {s.etat === "acquise" ? `🟢 ${fmtEuro(s.montant)}` : s.etat === "perdue" ? "🔴" : "⏳"}
                      </p>
                    ))}
                <p className="text-white/35">{fmtEuro(cartes.primes.montantParSemaine)} si ≥ {Math.round(cartes.primes.partRequise * 100)} % de l&apos;équipe au vert</p>
              </div>
            </div>
            <div className="rounded border border-white/10 bg-obsidian p-3">
              <p className={LABEL}>Absences et retenues</p>
              <p className="mt-1 font-display text-xl font-bold text-accent">− {fmtEuro(cartes.absences.retenues)}</p>
              <p className="font-sans text-[11px] text-white/50">{fmtHeures(cartes.absences.heures)} non justifiées</p>
            </div>
            <div className="rounded border border-accent/40 bg-obsidian p-3">
              <p className={LABEL}>Total à recevoir</p>
              <p className="mt-1 font-display text-xl font-bold text-accent">{fmtEuro(cartes.net)}</p>
              <p className="font-sans text-[11px] text-white/50">Net du mois {cartes.periode.split("-").reverse().join("/")}</p>
            </div>
          </div>
        </section>
      </div>

      {/* Ligne 4 : messages | réunions */}
      <div id="reunions" className="grid scroll-mt-4 gap-4 xl:grid-cols-2">
        <section className={PANEL}>
          <h3 className={PANEL_TITLE}>Diffusion de messages</h3>
          <p className="mt-1 font-sans text-xs text-white/50">Consignes et annonces : vos agents les voient dans leur espace.</p>
          <div className="mt-3 space-y-3">
            <div>
              <label className={LABEL} htmlFor="msg-dest">Destinataire</label>
              <select id="msg-dest" className={`mt-1 ${INPUT}`} value={message.agentId}
                onChange={(e) => setMessage({ ...message, agentId: e.target.value })}>
                <option value="">Toute l&apos;équipe</option>
                {data.equipe.map((a) => (
                  <option key={a.id} value={a.id}>{a.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="msg-texte">Message</label>
              <textarea id="msg-texte" rows={3} maxLength={1000} className={`mt-1 ${INPUT}`} value={message.texte}
                onChange={(e) => setMessage({ ...message, texte: e.target.value })} />
            </div>
            <button
              className={BTN}
              disabled={busy || !message.texte.trim()}
              onClick={() =>
                action(async () => {
                  await apiPost(`${base}/messages`, { texte: message.texte, agentId: message.agentId || null });
                  setMessage({ ...message, texte: "" });
                })
              }
            >
              Envoyer
            </button>
          </div>
          {data.messages.length > 0 && (
            <ul className="mt-4 space-y-2 border-t border-white/10 pt-3">
              {data.messages.slice(0, 5).map((m) => (
                <li key={m.id} className="font-sans text-xs text-white/60">
                  <span className="font-mono text-white/40">{fmtDateHeure(m.createdAt)}</span> ·{" "}
                  <span className="text-white/80">{m.destinataire}</span> — {m.texte}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={PANEL}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className={PANEL_TITLE}>Planification des réunions</h3>
            <p className={`font-sans text-xs ${data.reunions.cetteSemaine >= data.reunions.minParSemaine ? "text-statusGreen" : "text-statusOrange"}`}>
              Cette semaine : {data.reunions.cetteSemaine} / {data.reunions.minParSemaine} minimum
            </p>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="reu-titre">Titre</label>
              <input id="reu-titre" maxLength={120} className={`mt-1 ${INPUT}`} value={reunion.titre}
                onChange={(e) => setReunion({ ...reunion, titre: e.target.value })} />
            </div>
            <div>
              <label className={LABEL} htmlFor="reu-debut">Date et heure</label>
              <input id="reu-debut" type="datetime-local" className={`mt-1 ${INPUT}`} value={reunion.debut}
                onChange={(e) => setReunion({ ...reunion, debut: e.target.value })} />
            </div>
            <div>
              <label className={LABEL} htmlFor="reu-duree">Durée (min)</label>
              <input id="reu-duree" type="number" min={5} max={480} className={`mt-1 ${INPUT}`} value={reunion.dureeMin}
                onChange={(e) => setReunion({ ...reunion, dureeMin: e.target.value })} />
            </div>
            <fieldset className="sm:col-span-2">
              <legend className={LABEL}>Participants (aucun coché = toute l&apos;équipe)</legend>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                {data.equipe.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 font-sans text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={reunion.agentIds.includes(a.id)}
                      onChange={(e) =>
                        setReunion({
                          ...reunion,
                          agentIds: e.target.checked ? [...reunion.agentIds, a.id] : reunion.agentIds.filter((x) => x !== a.id),
                        })
                      }
                    />
                    {a.nom}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <button
            className={`mt-3 ${BTN}`}
            disabled={busy || !reunion.titre.trim() || !reunion.debut || Number(reunion.dureeMin) < 5}
            onClick={() =>
              action(async () => {
                await apiPost(`${base}/reunions`, {
                  titre: reunion.titre,
                  debut: new Date(reunion.debut).toISOString(),
                  dureeMin: Number(reunion.dureeMin),
                  agentIds: reunion.agentIds,
                });
                setReunion({ titre: "", debut: "", dureeMin: "30", agentIds: [] });
              })
            }
          >
            Planifier et inviter
          </button>
          <div className="mt-4 border-t border-white/10 pt-3">
            <p className={LABEL}>À venir</p>
            {data.reunions.aVenir.length === 0 ? (
              <p className="mt-2 font-sans text-sm text-white/50">Aucune réunion planifiée.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {data.reunions.aVenir.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-sans text-sm text-white">
                      {r.titre}
                      <span className="block font-mono text-[11px] text-white/45">
                        {fmtDateHeure(r.debut)} · {r.dureeMin} min · {r.type} ·{" "}
                        {r.participants.length > 3 ? `${r.participants.length} agents` : r.participants.join(", ")}
                      </span>
                    </p>
                    <div className="flex gap-2">
                      <button className={BTN_GHOST} onClick={() => ouvrirSalle(r.id)}>🎥 Rejoindre</button>
                      <button
                        className={BTN_GHOST}
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm("Annuler cette réunion ?")) action(() => apiDelete(`${base}/reunions/${r.id}`));
                        }}
                      >
                        Annuler
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
