import Reveal from "@/components/Reveal";

interface CecrGaugeProps {
  value: number; // 0-100
}

// Paliers CECR fournis par la cliente (jauge de cumul du mois).
const PALIERS = [
  { key: "b1", label: "B1", from: 30, to: 45, colorClass: "stroke-teal" },
  { key: "b2", label: "B2", from: 45, to: 60, colorClass: "stroke-success" },
  { key: "c1", label: "C1", from: 60, to: 75, colorClass: "stroke-accent" },
  { key: "c2", label: "C2", from: 75, to: 90, colorClass: "stroke-accent/50" },
] as const;

function palierAtteint(value: number): string {
  const hit = [...PALIERS].reverse().find((p) => value >= p.from);
  return hit ? hit.label : "Pré-B1";
}

function polarToCartesian(cx: number, cy: number, r: number, pct: number) {
  const angleDeg = (pct / 100) * 180 - 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeArc(cx: number, cy: number, r: number, fromPct: number, toPct: number) {
  const start = polarToCartesian(cx, cy, r, fromPct);
  const end = polarToCartesian(cx, cy, r, toPct);
  const largeArcFlag = toPct - fromPct <= 50 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

// Jauge en demi-cercle faite main (pas de dépendance externe) — segments
// colorés par palier CECR + aiguille pointant la valeur cumulée du mois.
export default function CecrGauge({ value }: CecrGaugeProps) {
  const cx = 120;
  const cy = 130;
  const r = 96;
  const strokeWidth = 16;
  const clamped = Math.min(100, Math.max(0, value));
  const needleAngle = (clamped / 100) * 180 - 90;
  const needleLength = r - 26;

  const segments = [
    { from: 0, to: 30, colorClass: "stroke-white/10" },
    ...PALIERS,
    { from: 90, to: 100, colorClass: "stroke-white/10" },
  ];

  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6 text-center">
        <h3 className="font-display text-lg font-semibold text-white">
          Jauge de cumul du mois
        </h3>
        <p className="mt-1 font-sans text-xs text-white/50">Paliers CECR</p>

        <svg viewBox="0 0 240 150" className="mx-auto mt-2 w-full max-w-[280px]" role="img" aria-label={`Progression CECR : ${clamped}%, palier atteint ${palierAtteint(clamped)}`}>
          {segments.map((seg) => (
            <path
              key={`${seg.from}-${seg.to}`}
              d={describeArc(cx, cy, r, seg.from, seg.to)}
              fill="none"
              className={seg.colorClass}
              strokeWidth={strokeWidth}
            />
          ))}

          <g transform={`rotate(${needleAngle} ${cx} ${cy})`}>
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - needleLength}
              className="stroke-white"
              strokeWidth={3}
              strokeLinecap="round"
            />
          </g>
          <circle cx={cx} cy={cy} r={5} className="fill-white" />

          {PALIERS.map((p) => {
            const mid = polarToCartesian(cx, cy, r + 16, (p.from + p.to) / 2);
            return (
              <text
                key={p.key}
                x={mid.x}
                y={mid.y}
                textAnchor="middle"
                fontSize={11}
                fontWeight={600}
                className="fill-white/60"
              >
                {p.label}
              </text>
            );
          })}
        </svg>

        <p className="-mt-2 font-display text-3xl font-bold text-accent">{clamped}%</p>
        <p className="mt-1 font-mono text-xs uppercase tracking-widest text-white/50">
          Palier atteint : {palierAtteint(clamped)}
        </p>
      </div>
    </Reveal>
  );
}
