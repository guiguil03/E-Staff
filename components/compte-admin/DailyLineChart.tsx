interface DailyPoint {
  label: string;
  value: number;
}

interface DailyLineChartProps {
  data: DailyPoint[];
}

// Courbe journalière faite main (même convention que ComparativeChart /
// ComparativeBarChart) — objectif atteint (%) jour par jour. Contrairement
// aux graphiques comparatifs, ne gère pas les valeurs null : le backend ne
// renvoie que les jours effectivement saisis, jamais un calendrier complet
// avec des trous inventés.
export default function DailyLineChart({ data }: DailyLineChartProps) {
  if (data.length === 0) return null;

  const width = Math.max(280, data.length * 32);
  const height = 180;
  const padding = { top: 16, right: 12, bottom: 26, left: 12 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const x = (i: number) =>
    padding.left + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2);
  const y = (v: number) => padding.top + innerH - (Math.max(0, Math.min(100, v)) / 100) * innerH;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.value)}`).join(" ");
  const labelStep = Math.max(1, Math.ceil(data.length / 8));

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-2"
        style={{ minWidth: width, height }}
        role="img"
        aria-label="Objectif atteint par jour"
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
          d={linePath}
          fill="none"
          className="stroke-accent"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((d, i) => (
          <circle key={i} cx={x(i)} cy={y(d.value)} r={3} className="fill-accent" />
        ))}
        {data.map(
          (d, i) =>
            (i % labelStep === 0 || i === data.length - 1) && (
              <text
                key={`l-${i}`}
                x={x(i)}
                y={height - 8}
                textAnchor="middle"
                fontSize={9}
                className="fill-white/50"
                fontFamily="var(--font-plex-mono), monospace"
              >
                {d.label}
              </text>
            )
        )}
      </svg>
    </div>
  );
}
