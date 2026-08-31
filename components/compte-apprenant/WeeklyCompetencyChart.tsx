"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";
import { COMPETENCY_DEFS, tauxAssimilation, type CompetencyKey } from "@/components/compte-formateur/gradingGrids";

interface NotationApi {
  competence: string;
  scoreOn20: number | null;
}

interface SeanceNotations {
  numero: number;
  startAt: string | null;
  notations: NotationApi[];
}

// 12 séances par groupe (voir backend Seance.numero, "1 à 12") réparties en
// 4 semaines de 3 séances — pas de champ "semaine" en base, on le déduit ici.
const WEEK_SIZE = 3;

// Palette catégorielle dédiée aux 5 compétences — la seule couleur de marque
// du thème sombre est l'accent or (voir tailwind.config.ts), donc ces teintes
// sont définies en inline style plutôt qu'en classes Tailwind (nécessaire
// pour des couleurs choisies dynamiquement par clé de compétence).
const COMPETENCY_STYLE: Record<CompetencyKey, { color: string; short: string }> = {
  comprehension_orale: { color: "#4C8FE0", short: "Compr. orale" },
  expression_orale: { color: "#D9A62E", short: "Expr. orale" },
  comprehension_ecrite: { color: "#3FA872", short: "Compr. écrite" },
  expression_ecrite: { color: "#E0762D", short: "Expr. écrite" },
  posture_eloquence: { color: "#9B6FE0", short: "Posture" },
};

interface WeekBucket {
  label: string;
  seances: SeanceNotations[];
}

function bucketize(seances: SeanceNotations[]): WeekBucket[] {
  const weeks: WeekBucket[] = [];
  for (const s of seances) {
    const weekIndex = Math.floor((s.numero - 1) / WEEK_SIZE);
    if (!weeks[weekIndex]) weeks[weekIndex] = { label: `Semaine ${weekIndex + 1}`, seances: [] };
    weeks[weekIndex].seances.push(s);
  }
  return weeks;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

interface WeekPeak {
  numero: number;
  overallPercent: number;
  competence: CompetencyKey;
}

interface WeekStats {
  label: string;
  competencyPercents: Partial<Record<CompetencyKey, number>>;
  peak: WeekPeak | null;
}

// Le "pic" d'une semaine = la séance où une compétence a atteint le
// pourcentage le plus élevé de la semaine (cf. demande cliente : "c'est
// durant la séance 9 que l'apprenant a eu la note la plus élevée sur la
// posture") — l'icône du badge reprend la couleur de cette compétence, le
// pourcentage affiché est la moyenne globale de cette séance-là.
function computeWeekStats(week: WeekBucket): WeekStats {
  const competencyPercents: Partial<Record<CompetencyKey, number>> = {};
  for (const def of COMPETENCY_DEFS) {
    const scores = week.seances
      .flatMap((s) => s.notations)
      .filter((n) => n.competence === def.key && n.scoreOn20 !== null)
      .map((n) => n.scoreOn20 as number);
    const pct = tauxAssimilation(average(scores));
    if (pct !== null) competencyPercents[def.key as CompetencyKey] = pct;
  }

  let peak: WeekPeak | null = null;
  let bestPct = -1;
  for (const s of week.seances) {
    const scored = s.notations.filter(
      (n): n is NotationApi & { scoreOn20: number } => n.scoreOn20 !== null
    );
    if (scored.length === 0) continue;
    const overallPercent = tauxAssimilation(average(scored.map((n) => n.scoreOn20)))!;
    for (const n of scored) {
      const pct = tauxAssimilation(n.scoreOn20)!;
      if (pct > bestPct) {
        bestPct = pct;
        peak = { numero: s.numero, overallPercent, competence: n.competence as CompetencyKey };
      }
    }
  }

  return { label: week.label, competencyPercents, peak };
}

// Graphique en barres groupées fait main (pas de dépendance externe, même
// convention que ComparativeBarChart/CompetencyRadar) — remplace l'ancienne
// courbe de moyenne hebdomadaire par la vue "un coup d'œil = évolution ou
// régression par semaine, compétence par compétence" demandée par la
// cliente, avec en tête une rangée de badges "pic" par semaine.
export default function WeeklyCompetencyChart() {
  const [seances, setSeances] = useState<SeanceNotations[] | "loading" | "erreur">("loading");

  useEffect(() => {
    const matricule = sessionStorage.getItem(ACCOUNT_MATRICULE_KEY);
    if (!matricule) {
      setSeances("erreur");
      return;
    }
    apiGet<SeanceNotations[]>(`/apprenants/${matricule}/notations`)
      .then(setSeances)
      .catch(() => setSeances("erreur"));
  }, []);

  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">
              Graphique comparatif hebdomadaire
            </h3>
            <p className="font-sans text-xs text-white/50">Progression des compétences</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-white/50">
            {COMPETENCY_DEFS.map((c) => (
              <span key={c.key} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: COMPETENCY_STYLE[c.key].color }}
                />
                {COMPETENCY_STYLE[c.key].short}
              </span>
            ))}
          </div>
        </div>

        {seances === "loading" && (
          <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>
        )}
        {seances === "erreur" && (
          <p className="mt-4 font-sans text-sm text-white/50">
            Impossible de charger votre progression pour le moment.
          </p>
        )}

        {Array.isArray(seances) && <ChartBody weeks={bucketize(seances).map(computeWeekStats)} />}
      </div>
    </Reveal>
  );
}

function ChartBody({ weeks }: { weeks: WeekStats[] }) {
  if (weeks.length === 0) {
    return (
      <p className="mt-4 font-sans text-sm text-white/50">
        Aucune séance planifiée pour le moment.
      </p>
    );
  }

  return (
    <>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {weeks.map((w) => (
          <PeakBadge key={w.label} week={w} />
        ))}
      </div>
      <BarChart weeks={weeks} />
    </>
  );
}

function PeakBadge({ week }: { week: WeekStats }) {
  if (!week.peak) {
    return (
      <div className="flex flex-col items-center gap-1 rounded border border-white/10 bg-obsidian/40 px-2 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/30">
          —
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">
          {week.label}
        </span>
      </div>
    );
  }

  const style = COMPETENCY_STYLE[week.peak.competence];
  return (
    <div className="flex flex-col items-center gap-1 rounded border border-white/10 bg-obsidian/40 px-2 py-3">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
        style={{ backgroundColor: `${style.color}26`, color: style.color }}
      >
        {style.short.slice(0, 2).toUpperCase()}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
        Séance {week.peak.numero}
      </span>
      <span className="font-mono text-lg font-semibold" style={{ color: style.color }}>
        {week.peak.overallPercent}%
      </span>
    </div>
  );
}

function BarChart({ weeks }: { weeks: WeekStats[] }) {
  const barWidth = 16;
  const barGap = 5;
  const groupGap = 26;
  const groupWidth = COMPETENCY_DEFS.length * barWidth + (COMPETENCY_DEFS.length - 1) * barGap;

  const padding = { top: 26, right: 14, bottom: 26, left: 14 };
  const innerW = weeks.length * groupWidth + (weeks.length - 1) * groupGap;
  const width = innerW + padding.left + padding.right;
  const height = 190;
  const innerH = height - padding.top - padding.bottom;

  const groupX = (wi: number) => padding.left + wi * (groupWidth + groupGap);

  return (
    <div className="mt-4 overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-2"
        style={{ minWidth: width, height }}
        role="img"
        aria-label="Progression des compétences par semaine"
      >
        <line
          x1={padding.left}
          y1={padding.top + innerH}
          x2={width - padding.right}
          y2={padding.top + innerH}
          className="stroke-white/15"
          strokeWidth={1}
        />
        {weeks.map((w, wi) => (
          <g key={w.label}>
            {COMPETENCY_DEFS.map((c, ci) => {
              const value = w.competencyPercents[c.key] ?? null;
              const style = COMPETENCY_STYLE[c.key];
              const cx = groupX(wi) + ci * (barWidth + barGap) + barWidth / 2;
              const ratio = value !== null ? Math.min(1, value / 100) : 0;
              const barHeight = innerH * ratio;
              const barY = padding.top + innerH - barHeight;
              return (
                <g key={c.key}>
                  {value !== null ? (
                    <>
                      <rect
                        x={cx - barWidth / 2}
                        y={barY}
                        width={barWidth}
                        height={Math.max(barHeight, 2)}
                        rx={2}
                        style={{ fill: style.color }}
                      />
                      <text
                        x={cx}
                        y={barY - 5}
                        textAnchor="middle"
                        fontSize={9}
                        style={{ fill: style.color }}
                        fontFamily="var(--font-plex-mono), monospace"
                      >
                        {value}%
                      </text>
                    </>
                  ) : (
                    <rect
                      x={cx - barWidth / 2}
                      y={padding.top + innerH - 2}
                      width={barWidth}
                      height={2}
                      rx={1}
                      className="fill-white/15"
                    />
                  )}
                </g>
              );
            })}
            <text
              x={groupX(wi) + groupWidth / 2}
              y={height - 8}
              textAnchor="middle"
              fontSize={10}
              className="fill-white/50"
              fontFamily="var(--font-plex-mono), monospace"
            >
              {w.label.toUpperCase()}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
