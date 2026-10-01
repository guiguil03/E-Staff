-- Formateur qui a commencé la correction d'un test d'admission (file
-- commune à tous les formateurs) — voir schema.prisma, EvaluationAttempt.
-- Pur ajout, non destructif.

-- AlterTable
ALTER TABLE "EvaluationAttempt" ADD COLUMN     "correcteurId" TEXT,
ADD COLUMN     "correctionPriseAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "EvaluationAttempt" ADD CONSTRAINT "EvaluationAttempt_correcteurId_fkey" FOREIGN KEY ("correcteurId") REFERENCES "Formateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
