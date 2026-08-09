-- CreateTable
CREATE TABLE "Presence" (
    "id" TEXT NOT NULL,
    "seanceId" TEXT NOT NULL,
    "apprenantId" TEXT,
    "role" TEXT NOT NULL,
    "dailyParticipantId" TEXT NOT NULL,
    "displayName" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL,
    "leftAt" TIMESTAMP(3),
    "dureeSecondes" INTEGER,

    CONSTRAINT "Presence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Presence_dailyParticipantId_key" ON "Presence"("dailyParticipantId");

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "Seance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_apprenantId_fkey" FOREIGN KEY ("apprenantId") REFERENCES "Apprenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

