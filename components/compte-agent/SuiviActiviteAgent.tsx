"use client";

import { useCallback, useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { agentMatricule, fmtDate, fmtHeures, fmtSemaine } from "./agentApi";

type Alerte = "rouge" | "orange" | "vert";

interface Journee {
  id: string;
  jour: string;
  realise: number | null;
  tauxAtteint: number;
  alerte: Alerte;
  heuresTravaillees: number;
  heuresPanne: number;
  remarques: string | null;
  statutValidation: "a_valider" | "valide";
  commentaireSuperviseur: string | null;
}

interface SemainePrime {
  semaine: string;
  rang: number;
  etat: "acquise" | "perdue" | "en_cours";
  montant: number;
}

interface SuiviActivite {
  agent: { statutPresence: string; statutPresenceDepuis: string };
  assistance: {
    superviseurNom: string | null;
    superviseurEmail: string | null;
    supportEmail: string | null;
  };
  mission: { id: string; clientNom: string; objectifJournalier: number | null } | null;
  appels: {
    enCours: { id: string; debut: string } | null;
    terminesAujourdhui: number;
    secondesAujourdhui: number;
  };
  aujourdhui: string;
  saisieDuJour: Journee | null;
  recapSemaine: { semaine: string; heures: number; panne: number; ventesValidees: number };
  courbeSemaine: {
    jour: string;
    heures: number;
    panne: number;
    tauxAtteint: number | null;
    alerte: Alerte | null;
  }[];
  jaugeMensuelle: { periode: string; tauxMoyen: number | null; pourcentage: number | null };
  cartes: {
    periode: string;
    salaire: {
      base: number;
      heuresReference: number;
      tauxHoraire: number;
      heuresValidees: number;
      heuresEnAttente: number;
      gagne: number;
    };
    pannes: { heures: number; retenues: number };
    primes: { semaines: SemainePrime[]; total: number; montantParSemaine: number };
    net: number;
  };
  historique: Journee[];
}

const CARD = "rounded border border-white/10 bg-obsidianCard p-5";
const LABEL = "font-mono text-[11px] uppercase tracking-widest text-white/40";
const INPUT =
  "w-full rounded border border-white/15 bg-obsidian px-3 py-2 font-sans text-sm text-white focus:border-accent focus:outline-none disabled:opacity-40";

const STATUTS: { value: string; label: string }[] = [
  { value: "en_ligne", label: "En ligne" },
  { value: "en_pause", label: "En pause" },
  { value: "en_formation", label: "En formation" },
  { value: "en_panne", label: "En panne" },
];

const ALERTE_STYLE: Record<Alerte, { color: string; border: string; bg: string; label: string; emoji: string; message: string }> = {
  rouge: {
    color: "text-statusRed",
    border: "border-statusRed/50",
    bg: "bg-statusRed/10",
    label: "Alerte rouge",
    emoji: "🔴",
    message: "Objectif non atteint : un point ou un rattrapage est nécessaire.",
  },
  orange: {
    color: "text-statusOrange",
    border: "border-statusOrange/50",
    bg: "bg-statusOrange/10",
    label: "Alerte orange",
    emoji: "🟠",
    message: "Niveau correct mais perfectible.",
  },
  vert: {
    color: "text-statusGreen",
    border: "border-statusGreen/50",
    bg: "bg-statusGreen/10",
    label: "Feu vert",
    emoji: "🟢",
    message: "Objectif validé, bravo !",
  },
};

const COULEUR_HEX: Record<Alerte, string> = {
  rouge: "#D8604F",
  orange: "#E0913A",
  vert: "#34A56F",
};

const fmtEuro = (n: number) =>
  `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

const JOURS_COURTS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function dureeDepuis(iso: string): string {
  const min = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}`;
}

function fmtChrono(secondes: number): string {
  const s = Math.max(0, Math.floor(secondes));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
}

// Chrono d'appel : l'agent l'active quand il décroche. Le début est tenu
// côté serveur, donc le temps écoulé reste juste après un rechargement.
function ChronoAppel({
  appels,
  onDemarrer,
  onTerminer,
  busy,
}: {
  appels: SuiviActivite["appels"];
  onDemarrer: () => void;
  onTerminer: () => void;
  busy: boolean;
}) {
  const [, setTick] = useState(0);
  const enCours = appels.enCours;
  useEffect(() => {
    if (!enCours) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [enCours]);

  const ecoule = enCours ? (Date.now() - new Date(enCours.debut).getTime()) / 1000 : 0;
  return (
    <div className={`${CARD} ${enCours ? "border-statusGreen/50" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className={LABEL}>Chrono d&apos;appel</p>
          <p
            className={`mt-1 font-mono text-4xl font-bold tabular-nums ${enCours ? "text-statusGreen" : "text-white/40"}`}
            aria-live="off"
          >
            {fmtChrono(ecoule)}
          </p>
          <p className="mt-1 font-sans text-xs text-white/50">
            {enCours ? "Appel en cours…" : "Activez le chrono dès que vous prenez un appel."}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className={LABEL}>Aujourd&apos;hui</p>
            <p className="mt-1 font-display text-xl text-white">
              {appels.terminesAujourdhui} appel{appels.terminesAujourdhui > 1 ? "s" : ""}
            </p>
            <p className="font-sans text-xs text-white/50">
              {fmtChrono(appels.secondesAujourdhui)} cumulées
            </p>
          </div>
          <button
            type="button"
            onClick={enCours ? onTerminer : onDemarrer}
            disabled={busy}
            className={`rounded px-5 py-3 font-sans text-sm font-semibold disabled:opacity-40 ${
              enCours ? "bg-statusRed text-white" : "bg-statusGreen text-obsidian"
            }`}
          >
            {enCours ? "■ Raccrocher" : "▶ Prendre l'appel"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CarteRemuneration({
  titre,
  valeur,
  children,
  accent,
}: {
  titre: string;
  valeur: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`${CARD} ${accent ? "border-accent/40" : ""}`}>
      <p className={LABEL}>{titre}</p>
      <p className="mt-2 font-display text-2xl font-bold text-accent">{valeur}</p>
      <div className="mt-2 space-y-1 font-sans text-xs text-white/55">{children}</div>
    </div>
  );
}

// Graphique de la semaine : barres d'heures et de panne, point de couleur
// (alerte du jour) au-dessus de chaque jour saisi.
function GraphiqueSemaine({ jours }: { jours: SuiviActivite["courbeSemaine"] }) {
  const width = 420;
  const height = 200;
  const pad = { top: 22, right: 8, bottom: 26, left: 8 };
  const innerH = height - pad.top - pad.bottom;
  const slot = (width - pad.left - pad.right) / jours.length;
  const max = Math.max(8, ...jours.map((j) => j.heures), ...jours.map((j) => j.panne));
  const h = (v: number) => (v / max) * innerH;
  const bw = Math.min(16, slot * 0.28);

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ minWidth: 320, height }}
        role="img"
        aria-label="Heures travaillées et temps de panne de la semaine"
      >
        <line
          x1={pad.left}
          x2={width - pad.right}
          y1={pad.top + innerH}
          y2={pad.top + innerH}
          stroke="rgba(255,255,255,0.15)"
        />
        {jours.map((j, i) => {
          const cx = pad.left + slot * i + slot / 2;
          const base = pad.top + innerH;
          return (
            <g key={j.jour}>
              <rect x={cx - bw - 1} y={base - h(j.heures)} width={bw} height={h(j.heures)} fill="#B8973E" />
              <rect x={cx + 1} y={base - h(j.panne)} width={bw} height={h(j.panne)} fill="#D8604F" />
              {j.alerte && <circle cx={cx} cy={10} r={5} fill={COULEUR_HEX[j.alerte]} />}
              <text x={cx} y={height - 8} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.5)">
                {JOURS_COURTS[i]}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex flex-wrap gap-4 font-sans text-xs text-white/50">
        <span>
          <span className="mr-1 inline-block h-2 w-2 bg-accent" />
          Heures
        </span>
        <span>
          <span className="mr-1 inline-block h-2 w-2 bg-statusRed" />
          Temps de panne
        </span>
        <span>● Pastille : objectif du jour (rouge / orange / vert)</span>
      </div>
    </div>
  );
}

// Jauge circulaire 0-100 %.
function JaugeMensuelle({ pourcentage }: { pourcentage: number | null }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const p = pourcentage ?? 0;
  const couleur = p >= 100 ? COULEUR_HEX.vert : p >= 60 ? COULEUR_HEX.orange : COULEUR_HEX.rouge;
  return (
    <svg viewBox="0 0 140 140" className="mx-auto h-36 w-36" role="img" aria-label={`Jauge mensuelle ${p}%`}>
      <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
      <circle
        cx="70"
        cy="70"
        r={r}
        fill="none"
        stroke={couleur}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${(p / 100) * c} ${c}`}
        transform="rotate(-90 70 70)"
      />
      <text x="70" y="76" textAnchor="middle" fontSize="24" fontWeight="700" fill="#fff">
        {pourcentage === null ? "—" : `${pourcentage}%`}
      </text>
    </svg>
  );
}

// Tableau de bord de saisie de l'agent : statut en direct, assistance, 4
// cartes de rémunération, saisie du jour, graphique hebdo, jauge mensuelle
// et historique avec l'état de validation.
export default function SuiviActiviteAgent() {
  const [data, setData] = useState<SuiviActivite | "loading" | "erreur">("loading");
  const [form, setForm] = useState({ realise: "", heures: "", panne: "", remarques: "" });
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ alerte: Alerte; taux: number } | null>(null);
  const [aide, setAide] = useState(false);
  const [appelBusy, setAppelBusy] = useState(false);

  const charger = useCallback(() => {
    const matricule = agentMatricule();
    if (!matricule) {
      setData("erreur");
      return Promise.resolve();
    }
    return apiGet<SuiviActivite>(`/agents/${matricule}/suivi-activite`)
      .then((d) => {
        setData(d);
        if (d.saisieDuJour) {
          setForm({
            realise: String(d.saisieDuJour.realise ?? ""),
            heures: String(d.saisieDuJour.heuresTravaillees),
            panne: String(d.saisieDuJour.heuresPanne),
            remarques: d.saisieDuJour.remarques ?? "",
          });
        }
      })
      .catch(() => setData("erreur"));
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  if (data === "loading") {
    return <p className="font-sans text-sm text-white/50">Chargement...</p>;
  }
  if (data === "erreur") {
    return (
      <p className="font-sans text-sm text-white/50">
        Impossible de charger votre suivi d&apos;activité pour le moment.
      </p>
    );
  }

  const matricule = agentMatricule();
  const verrouille = data.saisieDuJour?.statutValidation === "valide";
  const { cartes } = data;

  async function changerStatut(statut: string) {
    setErreur(null);
    try {
      await apiPut(`/agents/${matricule}/statut-presence`, { statut });
      await charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Changement de statut impossible.");
    }
  }

  async function basculerAppel(action: "demarrer" | "terminer") {
    setErreur(null);
    setAppelBusy(true);
    try {
      await apiPost(`/agents/${matricule}/appels/${action}`, {});
      await charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Chrono indisponible.");
    } finally {
      setAppelBusy(false);
    }
  }

  async function enregistrer() {
    setErreur(null);
    setSaving(true);
    try {
      const r = await apiPut<{ tauxAtteint: number; alerte: Alerte }>(
        `/agents/${matricule}/suivi-activite`,
        {
          realise: Number(form.realise),
          heuresTravaillees: Number(form.heures),
          heuresPanne: form.panne === "" ? 0 : Number(form.panne),
          remarques: form.remarques.trim() || null,
        }
      );
      setPopup({ alerte: r.alerte, taux: r.tauxAtteint });
      await charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  const formValide =
    form.realise !== "" && form.heures !== "" && Number(form.realise) >= 0 && Number(form.heures) >= 0;

  return (
    <div className="space-y-4">
      {/* En-tête : statut en direct + assistance */}
      <Reveal>
        <div className={CARD}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={LABEL}>Mon statut</p>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Statut de l'agent">
                {STATUTS.map((s) => {
                  const actif = data.agent.statutPresence === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      aria-pressed={actif}
                      onClick={() => changerStatut(s.value)}
                      className={`rounded border px-3 py-1.5 font-sans text-sm transition-colors ${
                        actif
                          ? "border-accent bg-accent/15 text-accent"
                          : "border-white/15 text-white/60 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 font-sans text-xs text-white/40">
                {data.agent.statutPresence === "hors_ligne"
                  ? "Vous êtes hors ligne."
                  : `Statut actif depuis ${dureeDepuis(data.agent.statutPresenceDepuis)}.`}
              </p>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setAide((v) => !v)}
                aria-expanded={aide}
                className="rounded border border-white/15 px-3 py-2 font-sans text-sm text-white/80 hover:border-accent hover:text-accent"
              >
                ? Besoin d&apos;aide
              </button>
              {aide && (
                <div className="absolute right-0 z-10 mt-2 w-72 rounded border border-white/15 bg-obsidianCard p-4 shadow-lg">
                  <p className="font-sans text-sm text-white">Joindre une personne :</p>
                  <ul className="mt-2 space-y-2 font-sans text-sm">
                    {data.assistance.superviseurEmail ? (
                      <li>
                        <a
                          className="text-accent hover:underline"
                          href={`mailto:${data.assistance.superviseurEmail}?subject=Assistance agent ${matricule}`}
                        >
                          Superviseur — {data.assistance.superviseurNom}
                        </a>
                      </li>
                    ) : (
                      <li className="text-white/50">Aucun superviseur affecté.</li>
                    )}
                    {data.assistance.supportEmail ? (
                      <li>
                        <a
                          className="text-accent hover:underline"
                          href={`mailto:${data.assistance.supportEmail}?subject=Support technique ${matricule}`}
                        >
                          Support technique
                        </a>
                      </li>
                    ) : (
                      <li className="text-white/50">Support technique : contact non configuré.</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
          {erreur && <p className="mt-3 font-sans text-sm text-statusRed">{erreur}</p>}
        </div>
      </Reveal>

      <ChronoAppel
        appels={data.appels}
        busy={appelBusy}
        onDemarrer={() => basculerAppel("demarrer")}
        onTerminer={() => basculerAppel("terminer")}
      />

      {/* 4 cartes de rémunération */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CarteRemuneration titre="Salaire" valeur={fmtEuro(cartes.salaire.gagne)}>
          <p>
            Base {fmtEuro(cartes.salaire.base)} pour {cartes.salaire.heuresReference} h
          </p>
          <p>Taux effectif : {fmtEuro(cartes.salaire.tauxHoraire)} / h</p>
          <p>
            {fmtHeures(cartes.salaire.heuresValidees)} validées
            {cartes.salaire.heuresEnAttente > 0 &&
              ` · ${fmtHeures(cartes.salaire.heuresEnAttente)} à valider`}
          </p>
        </CarteRemuneration>

        <CarteRemuneration titre="Pannes et retenues" valeur={`− ${fmtEuro(cartes.pannes.retenues)}`}>
          <p>Temps de panne validé : {fmtHeures(cartes.pannes.heures)}</p>
          <p>Retenue au taux horaire de {fmtEuro(cartes.salaire.tauxHoraire)}</p>
        </CarteRemuneration>

        <CarteRemuneration titre="Primes hebdomadaires" valeur={`+ ${fmtEuro(cartes.primes.total)}`}>
          {cartes.primes.semaines.length === 0 ? (
            <p>Aucune semaine saisie ce mois-ci.</p>
          ) : (
            cartes.primes.semaines.map((s) => (
              <p key={s.semaine}>
                Semaine {s.rang} :{" "}
                {s.etat === "acquise"
                  ? `🟢 ${fmtEuro(s.montant)}`
                  : s.etat === "perdue"
                    ? "🔴 non acquise"
                    : "⏳ en cours"}
              </p>
            ))
          )}
          <p className="text-white/40">
            {fmtEuro(cartes.primes.montantParSemaine)} si tout reste au vert toute la semaine.
          </p>
        </CarteRemuneration>

        <CarteRemuneration titre="Total à recevoir" valeur={fmtEuro(cartes.net)} accent>
          <p>
            {fmtEuro(cartes.salaire.base)} − {fmtEuro(cartes.pannes.retenues)} +{" "}
            {fmtEuro(cartes.primes.total)}
          </p>
          <p className="text-white/40">Net du mois {cartes.periode.split("-").reverse().join("/")}</p>
        </CarteRemuneration>
      </div>

      {/* Graphique hebdo + jauge mensuelle */}
      <div className="grid gap-3 lg:grid-cols-3">
        <div className={`${CARD} lg:col-span-2`}>
          <h3 className="font-display text-lg font-semibold text-white">Ma semaine</h3>
          <p className="mt-1 font-sans text-xs text-white/50">
            {fmtSemaine(data.recapSemaine.semaine)} — heures, pannes et objectifs jour par jour.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-3 border-b border-white/10 pb-3">
            <div>
              <p className={LABEL}>Heures</p>
              <p className="mt-1 font-display text-xl text-white">{fmtHeures(data.recapSemaine.heures)}</p>
            </div>
            <div>
              <p className={LABEL}>Panne</p>
              <p className="mt-1 font-display text-xl text-white">{fmtHeures(data.recapSemaine.panne)}</p>
            </div>
            <div>
              <p className={LABEL}>Ventes validées</p>
              <p className="mt-1 font-display text-xl text-white">{data.recapSemaine.ventesValidees}</p>
            </div>
          </div>
          <GraphiqueSemaine jours={data.courbeSemaine} />
        </div>

        <div className={CARD}>
          <h3 className="font-display text-lg font-semibold text-white">Objectif du mois</h3>
          <p className="mt-1 font-sans text-xs text-white/50">
            Taux moyen de vos journées saisies rapporté au seuil de feu vert.
          </p>
          <div className="mt-4">
            <JaugeMensuelle pourcentage={data.jaugeMensuelle.pourcentage} />
          </div>
          <p className="mt-2 text-center font-sans text-xs text-white/50">
            {data.jaugeMensuelle.tauxMoyen === null
              ? "Aucune journée saisie ce mois-ci."
              : `Taux moyen : ${data.jaugeMensuelle.tauxMoyen}%`}
          </p>
        </div>
      </div>

      {/* Saisie du jour */}
      <Reveal>
        <div className={CARD}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-lg font-semibold text-white">Ma journée</h3>
            <p className="font-mono text-xs text-white/50">{fmtDate(data.aujourdhui)}</p>
          </div>

          {!data.mission ? (
            <p className="mt-3 font-sans text-sm text-white/50">
              Aucune mission active : la saisie sera disponible dès votre affectation.
            </p>
          ) : !data.mission.objectifJournalier ? (
            <p className="mt-3 font-sans text-sm text-white/50">
              Aucun objectif journalier n&apos;est fixé sur votre mission : demandez à la RH de le
              renseigner pour pouvoir saisir votre journée.
            </p>
          ) : (
            <>
              <p className="mt-1 font-sans text-xs text-white/50">
                Objectif journalier : {data.mission.objectifJournalier} · le pourcentage atteint est
                calculé automatiquement.
              </p>
              {verrouille && (
                <p className="mt-3 rounded border border-statusGreen/40 bg-statusGreen/10 px-3 py-2 font-sans text-sm text-statusGreen">
                  🔒 Journée validée par votre superviseur — elle n&apos;est plus modifiable.
                  Contactez la RH pour demander une modification.
                </p>
              )}
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className={LABEL} htmlFor="s-heures">Heures effectuées</label>
                  <input id="s-heures" type="number" min={0} max={24} step="0.25" disabled={verrouille}
                    className={`mt-1 ${INPUT}`} value={form.heures}
                    onChange={(e) => setForm({ ...form, heures: e.target.value })} />
                </div>
                <div>
                  <label className={LABEL} htmlFor="s-panne">Temps de panne (h)</label>
                  <input id="s-panne" type="number" min={0} max={24} step="0.25" disabled={verrouille}
                    className={`mt-1 ${INPUT}`} value={form.panne}
                    onChange={(e) => setForm({ ...form, panne: e.target.value })} />
                </div>
                <div>
                  <label className={LABEL} htmlFor="s-realise">Ventes / objectifs validés</label>
                  <input id="s-realise" type="number" min={0} step={1} disabled={verrouille}
                    className={`mt-1 ${INPUT}`} value={form.realise}
                    onChange={(e) => setForm({ ...form, realise: e.target.value })} />
                </div>
                <div>
                  <label className={LABEL} htmlFor="s-notes">Notes</label>
                  <input id="s-notes" maxLength={1000} disabled={verrouille}
                    className={`mt-1 ${INPUT}`} value={form.remarques}
                    onChange={(e) => setForm({ ...form, remarques: e.target.value })} />
                </div>
              </div>
              <button
                type="button"
                onClick={enregistrer}
                disabled={verrouille || saving || !formValide}
                className="mt-4 rounded bg-accent px-4 py-2 font-sans text-sm font-semibold text-obsidian disabled:opacity-40"
              >
                {saving ? "Enregistrement..." : data.saisieDuJour ? "Mettre à jour ma journée" : "Valider ma journée"}
              </button>
            </>
          )}
        </div>
      </Reveal>

      {/* Historique */}
      <Reveal>
        <div className={CARD}>
          <h3 className="font-display text-lg font-semibold text-white">Mon historique</h3>
          {data.historique.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-white/50">Aucune journée saisie pour l&apos;instant.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    {["Jour", "Heures", "Panne", "Ventes", "Objectif", "Statut", "Note du superviseur"].map((h) => (
                      <th key={h} className={`${LABEL} py-2 pr-3`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.historique.map((j) => {
                    const a = ALERTE_STYLE[j.alerte];
                    return (
                      <tr key={j.id} className="border-b border-white/5">
                        <td className="py-2 pr-3 font-mono text-xs text-white/70">{fmtDate(j.jour)}</td>
                        <td className="py-2 pr-3 font-sans text-sm text-white">{fmtHeures(j.heuresTravaillees)}</td>
                        <td className="py-2 pr-3 font-sans text-sm text-white">{fmtHeures(j.heuresPanne)}</td>
                        <td className="py-2 pr-3 font-sans text-sm text-white">{j.realise ?? "—"}</td>
                        <td className={`py-2 pr-3 font-sans text-sm ${a.color}`}>
                          {a.emoji} {j.tauxAtteint}%
                        </td>
                        <td className="py-2 pr-3 font-sans text-sm text-white/70">
                          {j.statutValidation === "valide" ? "Validé" : "À valider"}
                        </td>
                        <td className="py-2 font-sans text-xs italic text-white/60">
                          {j.commentaireSuperviseur ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Reveal>

      {/* Pop-up d'alerte après saisie */}
      {popup && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label={ALERTE_STYLE[popup.alerte].label}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div
            className={`w-full max-w-sm rounded border ${ALERTE_STYLE[popup.alerte].border} ${ALERTE_STYLE[popup.alerte].bg} bg-obsidianCard p-6 text-center`}
          >
            <p className="text-4xl" aria-hidden>{ALERTE_STYLE[popup.alerte].emoji}</p>
            <p className={`mt-2 font-display text-xl font-bold ${ALERTE_STYLE[popup.alerte].color}`}>
              {ALERTE_STYLE[popup.alerte].label} — {popup.taux}%
            </p>
            <p className="mt-2 font-sans text-sm text-white/70">{ALERTE_STYLE[popup.alerte].message}</p>
            <button
              type="button"
              onClick={() => setPopup(null)}
              className="mt-4 rounded border border-white/20 px-4 py-2 font-sans text-sm text-white hover:border-accent"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
