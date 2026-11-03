import * as PDFDocument from "pdfkit";

export interface FacturePdfData {
  raisonSociale: string;
  clientNom: string;
  periode: string; // "2026-09"
  montant: number;
  statut: string; // "emise" | "payee"
  dateEmission: Date;
  datePaiement: Date | null;
}

// Génère le PDF de facture consulté/téléchargé par l'entreprise depuis son
// casier — même principe que generateContractPdf (evaluation/contract-pdf.ts) :
// pdfkit, pas de mise en page élaborée, généré à la demande (Facture n'a pas
// de PDF stocké, voir schema.prisma).
export function generateFacturePdf(data: FacturePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 56 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("Facture — e-Staf", { align: "left" });
    doc.moveDown(1.5);

    doc.fontSize(11).fillColor("#333333");
    doc.text(`Client : ${data.raisonSociale}`);
    doc.text(`Contrat : ${data.clientNom}`);
    doc.text(`Période : ${data.periode}`);
    doc.moveDown();

    doc.fontSize(13).fillColor("#000000").text("Détail");
    doc.fontSize(11).fillColor("#333333");
    doc.text(`Montant : ${data.montant.toLocaleString("fr-FR")} €`);
    doc.text(`Statut : ${data.statut === "payee" ? "Payée" : "Émise"}`);
    doc.text(`Date d'émission : ${data.dateEmission.toLocaleDateString("fr-FR")}`);
    if (data.datePaiement) {
      doc.text(`Date de paiement : ${data.datePaiement.toLocaleDateString("fr-FR")}`);
    }
    doc.moveDown(1.5);

    doc
      .fontSize(9)
      .fillColor("#777777")
      .text(
        "Document généré automatiquement par e-Staf. Pour toute question, contactez votre interlocuteur e-Staf.",
        { align: "left" }
      );

    doc.end();
  });
}
