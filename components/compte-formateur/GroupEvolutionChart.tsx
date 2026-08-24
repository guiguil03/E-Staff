"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

const SESSION_LABELS = ["S1", "S2", "S3", "S4"];

// Ordre fixe de 6 styles : 3 teintes de marque (vert/teal/or), chacune
// déclinée en trait plein puis pointillé pour la 2e moitié des groupes.
// Le pointillé sert de canal d'identité indépendant de la couleur — deux
// groupes de même teinte (A/D, B/E, C/F) restent distinguables même si
// leurs couleurs sont proches à l'œil (palette de marque limitée à 3 teintes).
const LINE_STYLES = [
  { stroke: "stroke-success", dot: "fill-success", dash: undefined },
  { stroke: "stroke-teal", dot: "fill-teal", dash: undefined },
  { stroke: "stroke-accent", dot: "fill-accent", dash: undefined },
  { stroke: "stroke-success", dot: "fill-success", dash: "6 4" },
  { stroke: "stroke-teal", dot: "fill-teal", dash: "6 4" },
  { stroke: "stroke-accent", dot: "fill-accent", dash: "6 4" },
] as const;

interface Series {
  key: string;
  points: (number | null)[]; // % par séance, une valeur par SESSION_LABELS — null si pas encore noté
  style: (typeof LINE_STYLES)[number];
}

interface EvolutionApi {
  seances: number[];
  series: { cle: string; points: (number | null)[] }[];
}

function formateurHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-formateur-matricule": matricule } : {};
}

// Courbe d'évolution des groupes sur les séances 1→4, en % (somme des 5
// compétences /20 notées à cette séance, ramenée sur 100). Branchée sur la
// vraie table Notation depuis 2026-08-24 (voir /cockpit/evolution) — un
// point reste vide (pas de marqueur) tant que la séance correspondante n'a
// pas ses 5 compétences notées pour au moins un apprenant du groupe.
export default function GroupEvolutionChart() {
  const [series, setSeries] = useState<Series[] | "loading" | "erreur">("loading");

  useEffect(() => {
    apiGet<EvolutionApi>("/cockpit/evolution", formateurHeaders())
      .then((data) => {
        setSeries(
          data.series.map((s, i) => ({
            key: s.cle,
            points: s.points,
            style: LINE_STYLES[i % LINE_STYLES.length],
          }))
        );
      })
      .catch(() => setSeries("erreur"));
  }, []);

  const width = 1040;
  const height = 260;
  const padding = { top: 16, right: 40, bottom: 28, left: 36 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const x = (i: number) => padding.left + (i / (SESSION_LABELS.length - 1)) * innerW;
  const y = (v: number) => padding.top + innerH - (v / 100) * innerH;

  const gridTicks = [0, 25, 50, 75, 100];

  if (series === "loading" || series === "erreur") {
    return (
      <Reveal>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <h3 className="font-display text-lg font-semibold text-white">Évolution des groupes</h3>
          <p className="mt-4 font-sans text-sm text-white/50">
            {series === "loading" ? "Chargement..." : "Impossible de charger l'évolution pour le moment."}
          </p>
        </div>
      </Reveal>
    );
  }

  const SERIES = series;

  // Étiquettes de fin de ligne (dernière séance notée) : évite les
  // chevauchements en espaçant verticalement les groupes dont les valeurs
  // finales sont proches. Un groupe sans aucun point noté n'a pas d'étiquette.
  const endLabels = SERIES.map((s) => {
    const lastIndex = [...s.points].map((v, i) => (v !== null ? i : -1)).filter((i) => i >= 0).pop();
    if (lastIndex === undefined) return null;
    const value = s.points[lastIndex]!;
    return { key: s.key, style: s.style, value, y: y(value) };
  }).filter((l): l is { key: string; style: Series["style"]; value: number; y: number } => l !== null)
    .sort((a, b) => a.y - b.y);

  const MIN_GAP = 16;
  for (let i = 1; i < endLabels.length; i++) {
    if (endLabels[i].y - endLabels[i - 1].y < MIN_GAP) {
      endLabels[i].y = endLabels[i - 1].y + MIN_GAP;
    }
  }

  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">
              Évolution des groupes
            </h3>
            <p className="mt-1 font-sans text-xs text-white/50">
              Moyenne pondérée par séance, en % — S1 à S4
            </p>
          </div>
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="mt-4 w-full"
          role="img"
          aria-label="Évolution en pourcentage de la moyenne pondérée de chaque groupe, séances S1 à S4"
        >
          {gridTicks.map((t) => (
            <g key={t}>
              <line
                x1={padding.left}
                y1={y(t)}
                x2={width - padding.right}
                y2={y(t)}
                className="stroke-white/10"
                strokeWidth={1}
              />
              <text
                x={padding.left - 8}
                y={y(t)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={10}
                className="fill-white/40"
                fontFamily="var(--font-plex-mono), monospace"
              >
                {t}%
              </text>
            </g>
          ))}

          {SERIES.map((s) => {
            // Ne relie que les points connus — un trou (séance pas encore
            // notée) coupe la ligne plutôt que de tracer un faux 0.
            const known = s.points
              .map((v, i) => (v !== null ? { v, i } : null))
              .filter((p): p is { v: number; i: number } => p !== null);
            const linePath = known
              .map((p, idx) => `${idx === 0 ? "M" : "L"} ${x(p.i)} ${y(p.v)}`)
              .join(" ");
            return (
              <g key={s.key}>
                <path
                  d={linePath}
                  fill="none"
                  className={s.style.stroke}
                  strokeWidth={2}
                  strokeDasharray={s.style.dash}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {known.map(({ v, i }) => (
                  <circle
                    key={i}
                    cx={x(i)}
                    cy={y(v)}
                    r={4}
                    strokeWidth={2}
                    className={`${s.style.dot} stroke-obsidianCard`}
                  >
                    <title>
                      Groupe {s.key} — {SESSION_LABELS[i]} : {v}%
                    </title>
                  </circle>
                ))}
              </g>
            );
          })}

          {SESSION_LABELS.map((label, i) => (
            <text
              key={label}
              x={x(i)}
              y={height - 6}
              textAnchor="middle"
              fontSize={10}
              className="fill-white/50"
              fontFamily="var(--font-plex-mono), monospace"
            >
              {label}
            </text>
          ))}

          {endLabels.map((l) => (
            <g key={l.key} transform={`translate(${width - padding.right + 12}, ${l.y})`}>
              <circle r={7} strokeWidth={2} className={`${l.style.dot} stroke-obsidianCard`} />
              <text
                x={0}
                y={0}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                fontWeight={700}
                className="fill-obsidian"
                fontFamily="var(--font-plex-mono), monospace"
              >
                {l.key}
              </text>
            </g>
          ))}
        </svg>

        <div className="mt-3 grid grid-cols-3 gap-x-4 gap-y-2 sm:grid-cols-6">
          {SERIES.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5 font-mono text-[11px] text-white/50">
              <svg width="16" height="8" className="shrink-0">
                <line
                  x1={0}
                  y1={4}
                  x2={16}
                  y2={4}
                  className={s.style.stroke}
                  strokeWidth={2}
                  strokeDasharray={s.style.dash}
                  strokeLinecap="round"
                />
              </svg>
              <span>
                {s.key} · {[...s.points].reverse().find((v) => v !== null) ?? "—"}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
