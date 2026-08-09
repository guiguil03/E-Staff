import Reveal from "@/components/Reveal";
import CompetencyRadar from "./CompetencyRadar";
import { APPRENANTS, GROUPES } from "./exampleData";

interface GroupDetailPanelProps {
  groupKey: string;
  onSelectApprenant: (id: string) => void;
  onClose: () => void;
}

const COMPETENCY_LABELS = [
  { key: "comprehension_orale", label: "Compréhension orale" },
  { key: "expression_orale", label: "Expression orale" },
  { key: "comprehension_ecrite", label: "Compréhension écrite" },
  { key: "expression_ecrite", label: "Expression écrite" },
  { key: "posture_eloquence", label: "Posture & Éloquence" },
];

export default function GroupDetailPanel({
  groupKey,
  onSelectApprenant,
  onClose,
}: GroupDetailPanelProps) {
  const group = GROUPES.find((g) => g.key === groupKey);
  const apprenants = APPRENANTS.filter((a) => a.groupe === groupKey);
  if (!group || apprenants.length === 0) return null;

  const avgCompetencies = COMPETENCY_LABELS.map((c) => ({
    ...c,
    score: Math.round(
      apprenants.reduce(
        (sum, a) => sum + (a.competencies.find((ac) => ac.key === c.key)?.score ?? 0),
        0
      ) / apprenants.length
    ),
  }));
  const avgAbsence = Math.round(
    apprenants.reduce((sum, a) => sum + a.tauxAbsence, 0) / apprenants.length
  );

  return (
    <Reveal>
      <div className="rounded border border-accent/30 bg-obsidianCard p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-white">
            {group.label} — {group.moyenne}/100
          </h3>
          <button
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-widest text-white/50 hover:text-accent"
          >
            Fermer ✕
          </button>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_240px]">
          <div>
            <p className="font-sans text-sm font-semibold text-white">
              Apprenants ({apprenants.length})
            </p>
            <ul className="mt-2 space-y-1.5">
              {apprenants.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => onSelectApprenant(a.id)}
                    className="flex w-full items-center justify-between rounded border border-white/10 bg-obsidian px-3 py-2 text-left transition-colors hover:border-accent/50"
                  >
                    <span className="font-sans text-sm text-white">
                      {a.firstName} {a.lastName}
                      {a.alerteDecrochage && (
                        <span className="ml-2 font-mono text-[10px] uppercase text-teal">
                          alerte
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-xs text-white/50">
                      {a.moyenneGlobale}/100
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <p className="mt-4 font-sans text-sm font-semibold text-white">Assiduité</p>
            <p className="mt-1 font-sans text-sm text-white/70">
              Taux d&apos;absence moyen : {avgAbsence}%
            </p>
          </div>

          <div>
            <p className="text-center font-sans text-sm font-semibold text-white">
              Radar de compétences collectif
            </p>
            <CompetencyRadar competencies={avgCompetencies} />
          </div>
        </div>
      </div>
    </Reveal>
  );
}
