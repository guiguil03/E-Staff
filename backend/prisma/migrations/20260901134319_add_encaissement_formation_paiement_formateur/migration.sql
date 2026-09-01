-- AlterTable
ALTER TABLE "Formateur" ADD COLUMN     "tarifFixe" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "PaiementFormateur" (
    "id" TEXT NOT NULL,
    "formateurId" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "montantBase" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montantPrime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "moyenPaiement" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "datePaiement" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaiementFormateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EncaissementFormation" (
    "id" TEXT NOT NULL,
    "apprenantId" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "jour" TIMESTAMP(3) NOT NULL,
    "moyenPaiement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EncaissementFormation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaiementFormateur_formateurId_periode_key" ON "PaiementFormateur"("formateurId", "periode");

-- AddForeignKey
ALTER TABLE "PaiementFormateur" ADD CONSTRAINT "PaiementFormateur_formateurId_fkey" FOREIGN KEY ("formateurId") REFERENCES "Formateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EncaissementFormation" ADD CONSTRAINT "EncaissementFormation_apprenantId_fkey" FOREIGN KEY ("apprenantId") REFERENCES "Apprenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
