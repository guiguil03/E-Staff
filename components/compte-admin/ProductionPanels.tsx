import ProductionVueEnsemble from "./ProductionVueEnsemble";
import SuperviseursPanel from "./SuperviseursPanel";
import ContratsB2BPanel from "./ContratsB2BPanel";
import MissionsPanel from "./MissionsPanel";

export default function ProductionPanels() {
  return (
    <div className="space-y-6">
      <ProductionVueEnsemble />
      <ContratsB2BPanel />
      <SuperviseursPanel />
      <MissionsPanel />
    </div>
  );
}
