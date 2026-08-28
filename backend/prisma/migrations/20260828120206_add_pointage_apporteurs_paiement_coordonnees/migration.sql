-- AlterTable
ALTER TABLE "Apprenant" ADD COLUMN     "connecteurId" TEXT,
ADD COLUMN     "coordonneesVerifieesLe" TIMESTAMP(3),
ADD COLUMN     "moyenPaiementType" TEXT,
ADD COLUMN     "ribOuMobileMoney" TEXT,
ADD COLUMN     "sourceRecrutement" TEXT,
ADD COLUMN     "statutAgent" TEXT NOT NULL DEFAULT 'formation';

-- AlterTable
ALTER TABLE "ContratB2B" ADD COLUMN     "connecteurId" TEXT;

-- AlterTable
ALTER TABLE "SuiviAgentHebdo" ADD COLUMN     "caRealise" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "heuresAbsenceNonJustifiee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "heuresRetardCumulees" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "heuresSupValidees" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "nbVentes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rdvValides" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CommissionDemarrageApporteur" (
    "id" TEXT NOT NULL,
    "contratId" TEXT NOT NULL,
    "connecteurId" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "datePaiement" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionDemarrageApporteur_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommissionDemarrageApporteur_contratId_key" ON "CommissionDemarrageApporteur"("contratId");

-- AddForeignKey
ALTER TABLE "Apprenant" ADD CONSTRAINT "Apprenant_connecteurId_fkey" FOREIGN KEY ("connecteurId") REFERENCES "Connecteur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratB2B" ADD CONSTRAINT "ContratB2B_connecteurId_fkey" FOREIGN KEY ("connecteurId") REFERENCES "Connecteur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionDemarrageApporteur" ADD CONSTRAINT "CommissionDemarrageApporteur_contratId_fkey" FOREIGN KEY ("contratId") REFERENCES "ContratB2B"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionDemarrageApporteur" ADD CONSTRAINT "CommissionDemarrageApporteur_connecteurId_fkey" FOREIGN KEY ("connecteurId") REFERENCES "Connecteur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
