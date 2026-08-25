"use client";

import { useState } from "react";
import ValidationRhPanel from "./ValidationRhPanel";
import PaiementsPanel from "./PaiementsPanel";
import PipelineOverviewPanel from "./PipelineOverviewPanel";

export default function RecrutementPanels() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <ValidationRhPanel onChange={() => setRefreshKey((k) => k + 1)} />
      <PaiementsPanel onChange={() => setRefreshKey((k) => k + 1)} />
      <PipelineOverviewPanel key={refreshKey} />
    </div>
  );
}
