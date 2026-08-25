import GroupesPanel from "./GroupesPanel";
import RegistrePanel from "./RegistrePanel";
import FormateursPanel from "./FormateursPanel";
import ComingSoonPanel from "./ComingSoonPanel";

export default function AcademiePanels() {
  return (
    <div className="space-y-6">
      <GroupesPanel />
      <FormateursPanel />
      <RegistrePanel />
      <ComingSoonPanel
        title="Historique des vagues & comparatif détaillé"
        items={[
          "Historique des vagues précédentes par formateur (nécessite un archivage des groupes clos)",
          "Comparatif des taux de réussite et scores d'éloquence par vague",
        ]}
      />
    </div>
  );
}
