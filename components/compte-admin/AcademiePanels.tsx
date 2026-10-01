import GroupesPanel from "./GroupesPanel";
import RegistrePanel from "./RegistrePanel";
import FormateursPanel from "./FormateursPanel";
import HistoriqueVaguesPanel from "./HistoriqueVaguesPanel";

export default function AcademiePanels() {
  return (
    <div className="space-y-6">
      <GroupesPanel />
      <FormateursPanel />
      <RegistrePanel />
      <HistoriqueVaguesPanel />
    </div>
  );
}
