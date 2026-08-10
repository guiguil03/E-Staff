-- AlterTable
ALTER TABLE "EvaluationAttempt" ADD COLUMN     "videoScore" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "VideoResponse" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "taskIndex" INTEGER NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "gradedCriteria" TEXT,
    "gradedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VideoResponse_attemptId_taskIndex_key" ON "VideoResponse"("attemptId", "taskIndex");

-- AddForeignKey
ALTER TABLE "VideoResponse" ADD CONSTRAINT "VideoResponse_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "EvaluationAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
