interface BarDatum {
  label: string;
  value: number | null;
}

interface ComparativeBarChartProps {
  data: BarDatum[];
  maxValue: number;
  valueSuffix?: string;
}

// Graphique en barres verticales fait main (même convention que
// ComparativeChart/CompetencyRadar — pas de dépendance de charting externe)
// — utilisé pour les comparatifs Formateurs/Superviseurs du Portail RH.
// Une valeur null (rien à comparer pour l'instant) se rend comme une barre
// vide avec "—" plutôt qu'une barre à 0, pour ne pas laisser croire à une
// performance nulle.
export default function ComparativeBarChart({ data, maxValue, valueSuffix = "" }: ComparativeBarChartProps) {
  if (data.length === 0) return null;

  const width = Math.max(320, data.length * 110);
  const height = 200;
  const padding = { top: 24, right: 16, bottom: 34, left: 16 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const barSlot = innerW / data.length;
  const barWidth = Math.min(56, barSlot * 0.55);

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-2"
        style={{ minWidth: width, height }}
        role="img"
        aria-label="Graphique comparatif"
      >
        <line
          x1={padding.left}
          y1={padding.top + innerH}
          x2={width - padding.right}
          y2={padding.top + innerH}
          className="stroke-white/15"
          strokeWidth={1}
        />
        {data.map((d, i) => {
          const cx = padding.left + barSlot * i + barSlot / 2;
          const ratio = d.value !== null ? Math.min(1, d.value / maxValue) : 0;
          const barHeight = innerH * ratio;
          const barY = padding.top + innerH - barHeight;
          return (
            <g key={d.label}>
              {d.value !== null ? (
                <rect
                  x={cx - barWidth / 2}
                  y={barY}
                  width={barWidth}
                  height={Math.max(barHeight, 2)}
                  rx={3}
                  className="fill-accent"
                />
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
              <text
                x={cx}
                y={barY - 6}
                textAnchor="middle"
                fontSize={11}
                className="fill-accent"
                fontFamily="var(--font-plex-mono), monospace"
              >
                {d.value !== null ? `${d.value}${valueSuffix}` : "—"}
              </text>
              <text
                x={cx}
                y={height - 12}
                textAnchor="middle"
                fontSize={10}
                className="fill-white/50"
                fontFamily="var(--font-plex-mono), monospace"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
