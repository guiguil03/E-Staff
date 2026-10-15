import * as PDFDocument from "pdfkit";

export interface BilanHebdoPdfData {
  formateurNom: string;
  createdAt: Date;
  constat: string;
  analyse: string;
  axes: string;
  statsSnapshot: {
    moyenneGenerale: number | null;
    tauxPresenceGlobal: number | null;
    rendusCorriges7j: number;
    vivierC1Total: number;
    alertesDecrochageActuelles: number;
  };
}

// Même pattern que evaluation/contract-pdf.ts (pdfkit, génération d'un
// Buffer à la volée) — ici régénéré à chaque téléchargement depuis les
// données déjà en base (BilanFormateur), pas de fichier stocké à part :
// contrairement au contrat, ce document n'a pas besoin d'exister
// indépendamment de la ligne qui le décrit.
export function generateBilanHebdoPdf(data: BilanHebdoPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 56 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("Bilan hebdomadaire — e-Staf", { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#777777");
    doc.text(`Formateur : ${data.formateurNom}`);
    doc.text(`Validé le : ${data.createdAt.toLocaleDateString("fr-FR")}`);
    doc.moveDown(1.5);

    doc.fontSize(13).fillColor("#000000").text("Chiffres clés (académie, à la date de validation)");
    doc.fontSize(11).fillColor("#333333");
    const s = data.statsSnapshot;
    doc.text(`Moyenne générale : ${s.moyenneGenerale !== null ? `${s.moyenneGenerale}/100` : "—"}`);
    doc.text(`Taux de présence global : ${s.tauxPresenceGlobal !== null ? `${s.tauxPresenceGlobal}%` : "—"}`);
    doc.text(`Rendus corrigés (7 derniers jours) : ${s.rendusCorriges7j}`);
    doc.text(`Vivier C1 : ${s.vivierC1Total}`);
    doc.text(`Alertes décrochage en cours : ${s.alertesDecrochageActuelles}`);
    doc.moveDown(1.5);

    doc.fontSize(13).fillColor("#000000").text("Constat");
    doc.fontSize(11).fillColor("#333333").text(data.constat, { align: "left" });
    doc.moveDown();

    doc.fontSize(13).fillColor("#000000").text("Analyse");
    doc.fontSize(11).fillColor("#333333").text(data.analyse, { align: "left" });
    doc.moveDown();

    doc.fontSize(13).fillColor("#000000").text("Axes d'amélioration");
    doc.fontSize(11).fillColor("#333333").text(data.axes, { align: "left" });
    doc.moveDown(1.5);

    doc
      .fontSize(9)
      .fillColor("#777777")
      .text("Document généré automatiquement par e-Staf.", { align: "left" });

    doc.end();
  });
}
