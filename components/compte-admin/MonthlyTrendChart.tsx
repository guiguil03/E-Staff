interface TrendPoint {
  label: string;
  serieA: number;
  serieB: number;
}

interface MonthlyTrendChartProps {
  data: TrendPoint[];
  labelA: string;
  labelB: string;
}

// Courbe à 2 séries faite main (même convention que ComparativeChart /
// DailyLineChart) — CA encaissé vs. dépenses réelles, mois par mois. Ne
// dessine que les mois où une donnée existe réellement (voir
// ProductionService.getTendanceMensuelleProduction) : jamais un historique
// de 12 mois fabriqué pour remplir le graphique.
export default function MonthlyTrendChart({ data, labelA, labelB }: MonthlyTrendChartProps) {
  if (data.length === 0) return null;

  const width = Math.max(320, data.length * 90);
  const height = 220;
  const padding = { top: 20, right: 16, bottom: 28, left: 16 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const values = data.flatMap((d) => [d.serieA, d.serieB]);
  const maxV = Math.max(...values, 1) * 1.1;

  const x = (i: number) =>
    padding.left + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2);
  const y = (v: number) => padding.top + innerH - (v / maxV) * innerH;

  const pathFor = (key: "serieA" | "serieB") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d[key])}`).join(" ");

  return (
    <div>
      <div className="flex items-center gap-4 font-mono text-[11px] text-white/50">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-accent" /> {labelA}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-teal" /> {labelB}
        </span>
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="mt-2"
          style={{ minWidth: width, height }}
          role="img"
          aria-label={`${labelA} vs ${labelB}, par mois`}
        >
          <line
            x1={padding.left}
            y1={padding.top + innerH}
            x2={width - padding.right}
            y2={padding.top + innerH}
            className="stroke-white/15"
            strokeWidth={1}
          />
          <path
            d={pathFor("serieB")}
            fill="none"
            className="stroke-teal"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={pathFor("serieA")}
            fill="none"
            className="stroke-accent"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {data.map((d, i) => (
            <g key={d.label}>
              <circle cx={x(i)} cy={y(d.serieA)} r={3.5} className="fill-accent" />
              <circle cx={x(i)} cy={y(d.serieB)} r={3.5} className="fill-teal" />
              <text
                x={x(i)}
                y={height - 8}
                textAnchor="middle"
                fontSize={10}
                className="fill-white/50"
                fontFamily="var(--font-plex-mono), monospace"
              >
                {d.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
