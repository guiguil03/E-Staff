import Reveal from "@/components/Reveal";

interface AssiduiteRow {
  semaine: number;
  tauxAbsence: number;
  retards: number;
  statut: "ok" | "attention" | "alerte";
}

interface OperationalTrackingProps {
  assiduite: AssiduiteRow[];
  alerteCompetence: string;
  commentaire: { text: string; author: string };
}

const STATUT_DOT: Record<AssiduiteRow["statut"], string> = {
  ok: "bg-success",
  attention: "bg-accent",
  alerte: "bg-teal", // pas de rouge dans la palette e-Staf ; teal utilisé comme second signal
};

export default function OperationalTracking({
  assiduite,
  alerteCompetence,
  commentaire,
}: OperationalTrackingProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Reveal>
        <div className="h-full rounded border border-white/10 bg-obsidianCard p-6">
          <h3 className="font-display text-base font-semibold text-white">
            Suivi de présence
          </h3>
          <p className="mt-1 font-sans text-xs text-white/50">
            Taux d&apos;absentéisme et nombre de retards par semaine
          </p>
          <table className="mt-4 w-full font-sans text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-white/40">
                <th className="py-2 font-mono font-normal">Semaine</th>
                <th className="py-2 font-mono font-normal">Absences</th>
                <th className="py-2 font-mono font-normal">Retards</th>
                <th className="py-2 font-mono font-normal">Statut</th>
              </tr>
            </thead>
            <tbody>
              {assiduite.map((row) => (
                <tr key={row.semaine} className="border-b border-white/5 text-white/80">
                  <td className="py-2">S{row.semaine}</td>
                  <td className="py-2">{row.tauxAbsence}%</td>
                  <td className="py-2">{row.retards}</td>
                  <td className="py-2">
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${STATUT_DOT[row.statut]}`}
                      aria-label={row.statut}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>

      <div className="flex flex-col gap-6">
        <Reveal delay={60}>
          <div className="rounded border border-accent/30 bg-obsidianCard p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              Alerte pédagogique
            </p>
            <p className="mt-2 font-sans text-sm text-white/80">
              Compétence à travailler en priorité cette semaine :{" "}
              <span className="font-semibold text-white">{alerteCompetence}</span>
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="rounded border border-white/10 bg-obsidianCard p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-white/50">
              Commentaire du formateur
            </p>
            <p className="mt-2 font-sans text-sm italic text-white/80">
              &laquo; {commentaire.text} &raquo;
            </p>
            <p className="mt-3 font-sans text-xs text-accent">— {commentaire.author}</p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
