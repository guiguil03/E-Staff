import * as PDFDocument from 'pdfkit';

export interface RegistrationContractPdfData {
  prenom: string;
  email: string;
  programme: string;
  duree: string;
  frais: string;
  conditions: string;
}

// Même principe que evaluation/contract-pdf.ts (pdfkit, pas de mise en page
// élaborée) — dupliqué plutôt que partagé car les deux contrats n'ont pas
// les mêmes champs (pas de résultat d'évaluation ici, juste le programme
// choisi) et évoluent indépendamment.
export function generateRegistrationContractPdf(
  data: RegistrationContractPdfData,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 56 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('Contrat de formation — e-Staf', { align: 'left' });
    doc.moveDown(1.5);

    doc.fontSize(11).fillColor('#333333');
    doc.text(`Inscrit : ${data.prenom}`);
    doc.text(`E-mail : ${data.email}`);
    doc.text(`Programme : ${data.programme}`);
    doc.moveDown();

    doc.fontSize(13).fillColor('#000000').text('Conditions de la formation');
    doc.fontSize(11).fillColor('#333333');
    doc.text(`Durée : ${data.duree}`);
    doc.text(`Frais : ${data.frais}`);
    doc.moveDown(0.5);
    doc.text(data.conditions, { align: 'left' });
    doc.moveDown(1.5);

    doc
      .fontSize(9)
      .fillColor('#777777')
      .text(
        'Document généré automatiquement par e-Staf. Pour toute question, contactez l\'équipe e-Staf.',
        { align: 'left' },
      );

    doc.end();
  });
}
