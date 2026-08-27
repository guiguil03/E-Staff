-- AlterTable
ALTER TABLE "Mission" ADD COLUMN     "tarifNegocie" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "PaiementAgent" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "montantBase" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montantPrime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "moyenPaiement" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "datePaiement" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaiementAgent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaiementAgent_missionId_periode_key" ON "PaiementAgent"("missionId", "periode");

-- AddForeignKey
ALTER TABLE "PaiementAgent" ADD CONSTRAINT "PaiementAgent_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
