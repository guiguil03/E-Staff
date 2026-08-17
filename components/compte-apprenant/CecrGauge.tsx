import Reveal from "@/components/Reveal";
import { PALIERS } from "./cecrPaliers";

interface CecrGaugeProps {
  /** Position absolue sur l'échelle 0-100 des paliers CECR (voir cecrPaliers.ts)
   * — pour une progression individuelle, calculer avec `computeJaugePosition`
   * plutôt que passer un cumul brut, sous peine de mal placer l'aiguille. */
  value: number; // 0-100
  title?: string;
  subtitle?: string;
  /** Nombre affiché en gros sous la jauge — par défaut `value`. À utiliser
   * quand `value` est une position déjà décalée par un niveau initial : afficher
   * le taux d'évolution brut (ex. "50%") est plus lisible que la position
   * absolue recalculée (ex. "67.5%"), tout en gardant l'aiguille/le palier
   * corrects puisqu'ils continuent d'utiliser `value`. */
  displayValue?: number;
  /** Remplace "Palier atteint : X" par un libellé personnalisé (ex. "% de la cohorte au niveau C1"). */
  valueLabel?: (paliers: string) => string;
  /** Si true, n'affiche que le contenu (pas de carte rounded/border/bg) — pour s'intégrer dans une grille bento qui gère déjà le fond et les séparateurs. */
  bare?: boolean;
}

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
export default function CecrGauge({
  value,
  title = "Jauge de cumul du mois",
  subtitle = "Paliers CECR",
  displayValue,
  valueLabel,
  bare = false,
}: CecrGaugeProps) {
  const cx = 120;
  const cy = 130;
  const r = 96;
  const strokeWidth = 16;
  const clamped = Math.min(100, Math.max(0, value));
  const displayed = Math.min(100, Math.max(0, displayValue ?? value));
  const needleAngle = (clamped / 100) * 180 - 90;
  const needleLength = r - 26;

  const segments = [
    { from: 0, to: 30, colorClass: "stroke-white/10" },
    ...PALIERS,
    { from: 90, to: 100, colorClass: "stroke-white/10" },
  ];

  return (
    <Reveal className="h-full">
      <div className={bare ? "h-full p-6 text-center" : "h-full rounded border border-white/10 bg-obsidianCard p-6 text-center"}>
        <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 font-sans text-xs text-white/50">{subtitle}</p>

        <svg viewBox="0 0 240 150" className="mx-auto mt-2 w-full max-w-[280px]" role="img" aria-label={`Progression CECR : ${displayed}%, palier atteint ${palierAtteint(clamped)}`}>
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

        <p className="-mt-2 font-display text-3xl font-bold text-accent">{displayed}%</p>
        <p className="mt-1 font-mono text-xs uppercase tracking-widest text-white/50">
          {valueLabel
            ? valueLabel(palierAtteint(clamped))
            : `Palier atteint : ${palierAtteint(clamped)}`}
        </p>
      </div>
    </Reveal>
  );
}
