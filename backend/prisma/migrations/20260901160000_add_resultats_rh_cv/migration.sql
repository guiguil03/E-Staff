-- AlterTable
ALTER TABLE "Candidat" ADD COLUMN     "cvKey" TEXT,
ADD COLUMN     "cvUploadedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EvaluationAttempt" ADD COLUMN     "resultatsCanal" TEXT,
ADD COLUMN     "resultatsEnvoyesLe" TIMESTAMP(3),
ADD COLUMN     "resultatsModele" TEXT,
ADD COLUMN     "rhNotifiedAt" TIMESTAMP(3);

