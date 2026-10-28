-- AlterTable
ALTER TABLE "Agent" ADD COLUMN "candidatId" TEXT;

-- CreateTable
CREATE TABLE "NoteClientAgent" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "note" DOUBLE PRECISION NOT NULL,
    "remarque" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteClientAgent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_candidatId_key" ON "Agent"("candidatId");

-- CreateIndex
CREATE INDEX "NoteClientAgent_missionId_date_idx" ON "NoteClientAgent"("missionId", "date");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_candidatId_fkey" FOREIGN KEY ("candidatId") REFERENCES "Candidat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteClientAgent" ADD CONSTRAINT "NoteClientAgent_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
