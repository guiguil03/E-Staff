-- AlterTable
ALTER TABLE "EvaluationAttempt" ADD COLUMN     "lexiqueQcmScore" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "EcritOuvertResponse" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "reformulationText" TEXT NOT NULL,
    "plurielTexts" TEXT NOT NULL,
    "styleText" TEXT NOT NULL,
    "synonymeText" TEXT NOT NULL,
    "redactionText" TEXT NOT NULL,
    "redactionWordCount" INTEGER NOT NULL,
    "score" DOUBLE PRECISION,
    "gradedCriteria" TEXT,
    "gradedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EcritOuvertResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EcritOuvertResponse_attemptId_key" ON "EcritOuvertResponse"("attemptId");

-- AddForeignKey
ALTER TABLE "EcritOuvertResponse" ADD CONSTRAINT "EcritOuvertResponse_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "EvaluationAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
