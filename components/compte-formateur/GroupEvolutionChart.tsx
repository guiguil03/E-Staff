import Reveal from "@/components/Reveal";
import { APPRENANTS, GROUPES } from "./exampleData";

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
  points: number[]; // % par séance, une valeur par SESSION_LABELS
  style: (typeof LINE_STYLES)[number];
}

const SERIES: Series[] = GROUPES.map((g, i) => {
  const membres = APPRENANTS.filter((a) => a.groupe === g.key);
  const points = SESSION_LABELS.map((_, si) =>
    Math.round(membres.reduce((sum, a) => sum + a.history[si].moyenne, 0) / membres.length)
  );
  return { key: g.key, points, style: LINE_STYLES[i % LINE_STYLES.length] };
});

// Courbe d'évolution des 6 groupes sur les séances S1→S4, en % (les notes
// brutes des grilles Oral/Écrit/Posture sont pondérées puis ramenées à un
// pourcentage — jamais affichées en "/100" sur ce graphique).
export default function GroupEvolutionChart() {
  const width = 1040;
  const height = 260;
  const padding = { top: 16, right: 40, bottom: 28, left: 36 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const x = (i: number) => padding.left + (i / (SESSION_LABELS.length - 1)) * innerW;
  const y = (v: number) => padding.top + innerH - (v / 100) * innerH;

  const gridTicks = [0, 25, 50, 75, 100];

  // Étiquettes de fin de ligne (dernière séance) : évite les chevauchements
  // en espaçant verticalement les groupes dont les valeurs finales sont proches.
  const endLabels = SERIES.map((s) => ({
    key: s.key,
    style: s.style,
    value: s.points[s.points.length - 1],
    y: y(s.points[s.points.length - 1]),
  })).sort((a, b) => a.y - b.y);

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
            const linePath = s.points
              .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`)
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
                {s.points.map((v, i) => (
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
                {s.key} · {s.points[s.points.length - 1]}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
