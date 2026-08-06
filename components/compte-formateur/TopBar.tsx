import Reveal from "@/components/Reveal";
import CecrGauge from "@/components/compte-apprenant/CecrGauge";
import type { GROUPES } from "./exampleData";

const STATUT_CLASSES: Record<string, string> = {
  vert: "border-success bg-success/10 text-success",
  orange: "border-accent bg-accent/10 text-accent",
  rouge: "border-teal bg-teal/10 text-teal", // pas de rouge dans la palette e-Staf
};

interface TopBarProps {
  globalC1Rate: number;
  groupes: typeof GROUPES;
  selectedGroup: string | null;
  onSelectGroup: (key: string) => void;
}

// Bilan instantané à la connexion : jauge C1 globale (30 apprenants) +
// tableau des 6 groupes A-F, cliquables pour ouvrir leur détail. Rend deux
// cellules bento distinctes (chacune sa propre carte) pour la grille
// compacte du Cockpit Formateur — le petit espace entre elles vient du gap
// de cette grille, pas d'un div partagé.
export default function TopBar({
  globalC1Rate,
  groupes,
  selectedGroup,
  onSelectGroup,
}: TopBarProps) {
  return (
    <>
      <div className="lg:col-span-2">
        <CecrGauge
          value={globalC1Rate}
          title="Jauge C1 Globale"
          subtitle="Réussite de la cohorte (30 apprenants)"
          valueLabel={() => "de la cohorte au niveau C1 ou +"}
        />
      </div>

      <div className="lg:col-span-4">
        <Reveal className="h-full">
          <div className="h-full rounded border border-white/10 bg-obsidianCard p-6">
            <h3 className="font-display text-lg font-semibold text-white">
              Suivi par groupe
            </h3>
            <p className="mt-1 font-sans text-xs text-white/50">
              Cliquez sur un groupe pour son détail (moyenne, apprenants, assiduité, radar)
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {groupes.map((g) => (
                <button
                  key={g.key}
                  onClick={() => onSelectGroup(g.key)}
                  className={`rounded border-2 p-3 text-center transition-transform hover:-translate-y-0.5 ${
                    STATUT_CLASSES[g.statut]
                  } ${selectedGroup === g.key ? "ring-2 ring-white/60" : ""}`}
                >
                  <p className="font-display text-xl font-bold">{g.key}</p>
                  <p className="font-mono text-xs opacity-80">{g.moyenne}/100</p>
                </button>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </>
  );
}
