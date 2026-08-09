-- AlterTable
ALTER TABLE "EvaluationAttempt" ADD COLUMN     "apprenantId" TEXT,
ADD COLUMN     "contractConditions" TEXT,
ADD COLUMN     "contractDuree" TEXT,
ADD COLUMN     "contractFrais" TEXT,
ADD COLUMN     "contractPdfKey" TEXT,
ADD COLUMN     "contractSentAt" TIMESTAMP(3),
ADD COLUMN     "paymentConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "paymentReference" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationAttempt_apprenantId_key" ON "EvaluationAttempt"("apprenantId");

-- AddForeignKey
ALTER TABLE "EvaluationAttempt" ADD CONSTRAINT "EvaluationAttempt_apprenantId_fkey" FOREIGN KEY ("apprenantId") REFERENCES "Apprenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

