"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { entrepriseMatricule, STATUT_PRESENCE_LABELS } from "./entrepriseApi";

type Alerte = "rouge" | "orange" | "vert";

interface LigneEquipe {
  id: string;
  matricule: string;
  nom: string;
  role: string;
  contratId: string;
  clientNom: string;
  statutPresence: string;
  tauxMoyenMois: number | null;
  alerte: Alerte | null;
  superviseurNom: string | null;
}

interface Dashboard {
  entreprise: { matricule: string; raisonSociale: string };
  contratId: string | null;
  periode: string;
  kpis: { agentsTotal: number; tauxGlobal: number | null; agentsOrange: number; agentsRouge: number };
  courbeSemaine: (number | null)[];
  statuts: Record<string, number>;
  equipe: LigneEquipe[];
  clients: { id: string; clientNom: string; statut: string }[];
}

const PANEL = "rounded border border-white/10 bg-obsidianCard p-5";
const PANEL_TITLE = "font-display text-base font-bold uppercase tracking-wide text-white";
const LABEL = "font-mono text-[11px] uppercase tracking-widest text-white/40";

const HEX: Record<Alerte, string> = { rouge: "#D8604F", orange: "#E0913A", vert: "#34A56F" };
const FOND: Record<Alerte, string> = { rouge: "bg-statusRed", orange: "bg-statusOrange", vert: "bg-statusGreen" };
const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const messageErreur = (e: unknown) => (e instanceof Error ? e.message : "Une erreur est survenue.");

function BarresSemaine({ jours }: { jours: (number | null)[] }) {
  const max = Math.max(6, ...jours.map((j) => j ?? 0));
  return (
    <div>
      <div className="flex h-28 items-end gap-2" role="img" aria-label="Évolution du taux hebdomadaire">
        {jours.map((v, i) => (
          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            {v !== null && <span className="font-mono text-[10px] text-white/60">{v}</span>}
            <div
              className="w-full rounded-t bg-accent/70"
              style={{ height: `${v === null ? 4 : Math.max(6, (v / max) * 80)}%` }}
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

function Jauge({ taux, alerte }: { taux: number | null; alerte: Alerte | null }) {
  const longueur = Math.PI * 70;
  const p = taux ?? 0;
  const couleur = alerte ? HEX[alerte] : "rgba(255,255,255,0.2)";
  return (
    <svg viewBox="0 0 160 100" className="mx-auto w-full max-w-[220px]" role="img" aria-label={`Taux moyen ${p}%`}>
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
        {taux === null ? "—" : `${taux}%`}
      </text>
    </svg>
  );
}

// Tableau de bord Entreprise — même principe que SuperviseurDashboard
// (polling 30s, sélecteur d'équipe/contrat) mais en LECTURE uniquement :
// l'entreprise suit ses équipes en temps réel, elle ne valide rien (ça
// reste le rôle du Superviseur/de la RH).
export default function EntrepriseDashboard() {
  const [data, setData] = useState<Dashboard | "loading" | "erreur">("loading");
  const [contratId, setContratId] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [heure, setHeure] = useState(() => new Date());
  const matricule = entrepriseMatricule();

  const charger = useCallback(() => {
    if (!matricule) {
      setData("erreur");
      return Promise.resolve();
    }
    const qs = contratId ? `?contratId=${encodeURIComponent(contratId)}` : "";
    return apiGet<Dashboard>(`/entreprises-comptes/${matricule}/dashboard${qs}`)
      .then((d) => {
        setData(d);
        setErreur(null);
      })
      .catch((e) => {
        setData("erreur");
        setErreur(messageErreur(e));
      });
  }, [matricule, contratId]);

  useEffect(() => {
    charger();
    const t = setInterval(charger, 30_000); // équipes en temps réel
    return () => clearInterval(t);
  }, [charger]);

  useEffect(() => {
    const t = setInterval(() => setHeure(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  if (data === "loading") return <p className="font-sans text-sm text-white/50">Chargement...</p>;
  if (data === "erreur") {
    return (
      <p className="font-sans text-sm text-white/50">
        {erreur ?? "Impossible de charger votre tableau de bord pour le moment."}
      </p>
    );
  }

  const taux = data.kpis.tauxGlobal;
  const alerteGlobale: Alerte | null = taux === null ? null : taux < 3 ? "rouge" : taux < 5 ? "orange" : "vert";
  const nomVue = data.contratId ? data.clients.find((c) => c.id === data.contratId)?.clientNom ?? "Équipe" : "Vision globale";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-accent/40 bg-accent/10 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 font-display text-base font-bold text-accent">Vos équipes</span>
          <button
            onClick={() => setContratId("")}
            className={`rounded border px-3 py-1.5 font-sans text-sm transition-colors ${
              contratId === "" ? "border-accent bg-accent text-obsidian" : "border-white/20 text-white/70 hover:border-accent"
            }`}
          >
            Vision globale
          </button>
          {data.clients.map((c) => (
            <button
              key={c.id}
              onClick={() => setContratId(c.id)}
              className={`rounded border px-3 py-1.5 font-sans text-sm transition-colors ${
                contratId === c.id ? "border-accent bg-accent text-obsidian" : "border-white/20 text-white/70 hover:border-accent"
              }`}
            >
              {c.clientNom}
            </button>
          ))}
        </div>
        <div className="text-right">
          <p className="font-sans text-sm font-semibold text-white">{data.entreprise.raisonSociale}</p>
          <p className="font-mono text-[11px] text-white/50">
            🕒 {heure.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={PANEL}>
          <h3 className={PANEL_TITLE}>
            Indicateurs clés <span className="font-sans text-sm font-normal normal-case text-white/50">({nomVue})</span>
          </h3>
          <div className="mt-4 grid gap-3 md:grid-cols-[1.1fr_1.2fr_0.9fr]">
            <div className="rounded border border-white/10 bg-obsidian p-3 text-center">
              <p className={LABEL}>Taux moyen d&apos;objectifs</p>
              <Jauge taux={taux} alerte={alerteGlobale} />
            </div>
            <div className="rounded border border-white/10 bg-obsidian p-3">
              <p className={`${LABEL} text-center`}>Évolution hebdomadaire</p>
              <div className="mt-3">
                <BarresSemaine jours={data.courbeSemaine} />
              </div>
            </div>
            <div className="grid gap-3">
              <div className="rounded border border-white/10 bg-obsidian p-3 text-center">
                <p className={LABEL}>Agents en poste</p>
                <p className="mt-1 font-display text-2xl font-bold text-white">{data.kpis.agentsTotal}</p>
              </div>
              <div className="rounded border border-white/10 bg-obsidian p-3 text-center">
                <p className={LABEL}>Agents en alerte</p>
                <p className="mt-1 font-sans text-sm text-white">
                  <span className="text-statusOrange">● {data.kpis.agentsOrange} orange</span> /{" "}
                  <span className="text-statusRed">● {data.kpis.agentsRouge} rouge</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={PANEL}>
          <h3 className={PANEL_TITLE}>
            Équipe en direct <span className="font-sans text-sm font-normal normal-case text-white/50">({nomVue})</span>
          </h3>
          {data.equipe.length === 0 ? (
            <p className="mt-4 font-sans text-sm text-white/50">Aucun agent en poste pour l&apos;instant.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className={`${LABEL} py-2 pr-2`}>Agent</th>
                    <th className={`${LABEL} py-2 pr-2`}>Statut</th>
                    <th className={`${LABEL} py-2 pr-2`}>Taux moyen</th>
                    <th className={`${LABEL} py-2`}>Superviseur</th>
                  </tr>
                </thead>
                <tbody>
                  {data.equipe.map((a) => {
                    const st = STATUT_PRESENCE_LABELS[a.statutPresence] ?? STATUT_PRESENCE_LABELS.hors_ligne;
                    return (
                      <tr key={a.id} className="border-b border-white/5">
                        <td className="py-2 pr-2 font-sans text-sm text-white">
                          {a.nom}
                          <span className="block font-mono text-[10px] text-white/40">{a.role} · {a.clientNom}</span>
                        </td>
                        <td className="py-2 pr-2">
                          <span className="flex items-center gap-1.5 font-sans text-xs text-white/70">
                            <span className={`h-3 w-3 rounded-full ${st.couleur}`} aria-hidden />
                            {st.label}
                          </span>
                        </td>
                        <td className="py-2 pr-2">
                          {a.tauxMoyenMois === null ? (
                            <span className="text-white/20">—</span>
                          ) : (
                            <span
                              className={`inline-block rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold text-obsidian ${FOND[a.alerte!]}`}
                            >
                              {a.tauxMoyenMois}%
                            </span>
                          )}
                        </td>
                        <td className="py-2 font-sans text-xs text-white/60">{a.superviseurNom ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
