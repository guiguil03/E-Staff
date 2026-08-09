import * as PDFDocument from "pdfkit";

export interface ContractPdfData {
  prenom: string;
  nom: string;
  email: string;
  tierLabel: string;
  totalScore: number | null;
  duree: string;
  frais: string;
  conditions: string;
}

// Génère le PDF de contrat remis au candidat retenu — pas de mise en page
// élaborée ni de signature électronique pour cette première version (voir
// brainstorm 2026-08-09), juste un document texte structuré et lisible.
// pdfkit plutôt que Puppeteer/react-pdf : pur Node, pas de Chromium à faire
// tourner sur Railway.
export function generateContractPdf(data: ContractPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 56 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("Contrat de formation — e-Staf", { align: "left" });
    doc.moveDown(1.5);

    doc.fontSize(11).fillColor("#333333");
    doc.text(`Candidat : ${data.prenom} ${data.nom}`);
    doc.text(`E-mail : ${data.email}`);
    doc.moveDown();

    doc.fontSize(13).fillColor("#000000").text("Résultat de l'évaluation");
    doc.fontSize(11).fillColor("#333333");
    doc.text(`Palier obtenu : ${data.tierLabel}`);
    if (data.totalScore !== null) {
      doc.text(`Score global : ${data.totalScore} / 100`);
    }
    doc.moveDown();

    doc.fontSize(13).fillColor("#000000").text("Conditions de la formation");
    doc.fontSize(11).fillColor("#333333");
    doc.text(`Durée : ${data.duree}`);
    doc.text(`Frais : ${data.frais}`);
    doc.moveDown(0.5);
    doc.text(data.conditions, { align: "left" });
    doc.moveDown(1.5);

    doc
      .fontSize(9)
      .fillColor("#777777")
      .text(
        "Document généré automatiquement par e-Staf. Pour toute question, contactez l'équipe e-Staf.",
        { align: "left" }
      );

    doc.end();
  });
}
