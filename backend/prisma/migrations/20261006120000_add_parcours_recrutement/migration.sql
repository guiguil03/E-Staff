-- AlterTable
ALTER TABLE "Candidat" ADD COLUMN "posteVise" TEXT,
ADD COLUMN "posteAutre" TEXT,
ADD COLUMN "experienceAnnees" INTEGER,
ADD COLUMN "experienceSecteurs" TEXT,
ADD COLUMN "parcoursPoste" TEXT,
ADD COLUMN "tauxObjectifs" INTEGER,
ADD COLUMN "videoPresentationKey" TEXT,
ADD COLUMN "videoPresentationUploadedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EvaluationAttempt" ADD COLUMN "parcours" TEXT NOT NULL DEFAULT 'admission';
