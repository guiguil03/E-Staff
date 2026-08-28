-- AlterTable
ALTER TABLE "Superviseur" ADD COLUMN     "coordonneesVerifieesLe" TIMESTAMP(3),
ADD COLUMN     "moyenPaiementType" TEXT,
ADD COLUMN     "ribOuMobileMoney" TEXT,
ADD COLUMN     "tarifFixe" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "PaiementSuperviseur" (
    "id" TEXT NOT NULL,
    "superviseurId" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "montantFixe" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "datePaiement" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaiementSuperviseur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceSuperviseurClient" (
    "id" TEXT NOT NULL,
    "superviseurId" TEXT NOT NULL,
    "contratId" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "tauxPerformance" DOUBLE PRECISION,
    "prime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceSuperviseurClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChargeInfrastructure" (
    "id" TEXT NOT NULL,
    "poste" TEXT NOT NULL,
    "motif" TEXT,
    "prestataire" TEXT,
    "periode" TEXT NOT NULL,
    "montantTheorique" DOUBLE PRECISION NOT NULL,
    "montantReel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pieceJustificativeKey" TEXT,
    "pieceJustificativeNom" TEXT,
    "modePaiement" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "datePaiement" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChargeInfrastructure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaiementSuperviseur_superviseurId_periode_key" ON "PaiementSuperviseur"("superviseurId", "periode");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceSuperviseurClient_superviseurId_contratId_period_key" ON "PerformanceSuperviseurClient"("superviseurId", "contratId", "periode");

-- AddForeignKey
ALTER TABLE "PaiementSuperviseur" ADD CONSTRAINT "PaiementSuperviseur_superviseurId_fkey" FOREIGN KEY ("superviseurId") REFERENCES "Superviseur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceSuperviseurClient" ADD CONSTRAINT "PerformanceSuperviseurClient_superviseurId_fkey" FOREIGN KEY ("superviseurId") REFERENCES "Superviseur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceSuperviseurClient" ADD CONSTRAINT "PerformanceSuperviseurClient_contratId_fkey" FOREIGN KEY ("contratId") REFERENCES "ContratB2B"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
