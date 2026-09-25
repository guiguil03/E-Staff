-- Enregistrements cloud Daily des classes virtuelles (voir schema.prisma,
-- model Enregistrement). Pur ajout, non destructif.

-- CreateTable
CREATE TABLE "Enregistrement" (
    "id" TEXT NOT NULL,
    "seanceId" TEXT NOT NULL,
    "dailyRecordingId" TEXT NOT NULL,
    "dureeSecondes" INTEGER,
    "debutAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enregistrement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Enregistrement_dailyRecordingId_key" ON "Enregistrement"("dailyRecordingId");

-- CreateIndex
CREATE INDEX "Enregistrement_seanceId_idx" ON "Enregistrement"("seanceId");

-- AddForeignKey
ALTER TABLE "Enregistrement" ADD CONSTRAINT "Enregistrement_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "Seance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
