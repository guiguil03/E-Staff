import Reveal from "@/components/Reveal";

interface ChartPoint {
  label: string;
  value: number;
}

interface ComparativeChartProps {
  points: ChartPoint[];
  niveauInitial: number;
}

// Petit graphique en ligne fait main (pas de dépendance externe) —
// courbe d'évolution de la moyenne hebdomadaire vs. le niveau initial.
export default function ComparativeChart({ points, niveauInitial }: ComparativeChartProps) {
  const width = 560;
  const height = 220;
  const padding = { top: 16, right: 24, bottom: 28, left: 28 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const values = points.map((p) => p.value);
  const minV = Math.min(...values, niveauInitial) - 5;
  const maxV = Math.max(...values, niveauInitial) + 5;

  const x = (i: number) =>
    padding.left + (points.length > 1 ? (i / (points.length - 1)) * innerW : innerW / 2);
  const y = (v: number) => padding.top + innerH - ((v - minV) / (maxV - minV)) * innerH;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.value)}`).join(" ");
  const initialY = y(niveauInitial);

  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg font-semibold text-white">
            Graphique comparatif hebdomadaire
          </h3>
          <div className="flex items-center gap-4 font-mono text-[11px] text-white/50">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-accent" /> Moyenne hebdomadaire
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 border-t border-dashed border-white/40" /> Niveau
              initial
            </span>
          </div>
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="mt-4 w-full"
          role="img"
          aria-label="Évolution de la moyenne hebdomadaire comparée au niveau initial"
        >
          <line
            x1={padding.left}
            y1={initialY}
            x2={width - padding.right}
            y2={initialY}
            className="stroke-white/30"
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
          <path
            d={linePath}
            fill="none"
            className="stroke-accent"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((p, i) => (
            <circle key={p.label} cx={x(i)} cy={y(p.value)} r={4} className="fill-accent" />
          ))}
          {points.map((p, i) => (
            <text
              key={p.label}
              x={x(i)}
              y={height - 6}
              textAnchor="middle"
              fontSize={10}
              className="fill-white/50"
              fontFamily="var(--font-plex-mono), monospace"
            >
              {p.label}
            </text>
          ))}
        </svg>
      </div>
    </Reveal>
  );
}
