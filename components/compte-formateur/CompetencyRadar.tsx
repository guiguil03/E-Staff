interface CompetencyRadarProps {
  competencies: { key: string; label: string; score: number }[]; // /20
}

// Libellés courts distincts pour les axes — un simple `.split(" ")[0]`
// confond "Compréhension orale" et "Compréhension écrite" (idem pour
// Expression), donc chaque clé a son propre libellé abrégé explicite.
const SHORT_LABELS: Record<string, string> = {
  comprehension_orale: "Compr. orale",
  expression_orale: "Expr. orale",
  comprehension_ecrite: "Compr. écrite",
  expression_ecrite: "Expr. écrite",
  posture_eloquence: "Posture",
};

// Radar de compétences collectif fait main (pas de dépendance externe) —
// moyenne du groupe sur les 5 compétences.
export default function CompetencyRadar({ competencies }: CompetencyRadarProps) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 76;
  const n = competencies.length;
  const angleFor = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const outer = competencies.map((_, i) => {
    const angle = angleFor(i);
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  const points = competencies.map((c, i) => {
    const radius = (c.score / 20) * r;
    const angle = angleFor(i);
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });

  // Marge autour du dessin pour que les libellés (ancrés start/end en bord
  // de cercle) ne soient jamais rognés par les limites du viewBox.
  const margin = 34;

  return (
    <svg
      viewBox={`-${margin} -${margin} ${size + margin * 2} ${size + margin * 2}`}
      className="mx-auto w-full max-w-[240px]"
      role="img"
      aria-label="Radar des compétences collectif du groupe"
    >
      <polygon
        points={outer.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="none"
        className="stroke-white/15"
        strokeWidth={1}
      />
      {outer.map((p, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={p.x}
          y2={p.y}
          className="stroke-white/10"
          strokeWidth={1}
        />
      ))}
      <polygon
        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
        className="fill-accent/25 stroke-accent"
        strokeWidth={2}
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} className="fill-accent" />
      ))}
      {competencies.map((c, i) => {
        const angle = angleFor(i);
        const labelR = r + 22;
        const cos = Math.cos(angle);
        // Ancrage dynamique : les libellés proches de la verticale restent
        // centrés, ceux qui penchent à droite/gauche s'alignent vers
        // l'extérieur pour ne pas être coupés par le viewBox.
        const anchor = cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
        return (
          <text
            key={c.key}
            x={cx + labelR * cos}
            y={cy + labelR * Math.sin(angle)}
            textAnchor={anchor}
            fontSize={9}
            className="fill-white/60"
          >
            {SHORT_LABELS[c.key] ?? c.label}
          </text>
        );
      })}
    </svg>
  );
}
