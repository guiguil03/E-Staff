-- AlterTable
ALTER TABLE "EvaluationAttempt" ADD COLUMN     "essayScore" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "EssayResponse" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "subjectKey" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "score" DOUBLE PRECISION,
    "gradedCriteria" TEXT,
    "gradedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EssayResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EssayResponse_attemptId_key" ON "EssayResponse"("attemptId");

-- AddForeignKey
ALTER TABLE "EssayResponse" ADD CONSTRAINT "EssayResponse_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "EvaluationAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
