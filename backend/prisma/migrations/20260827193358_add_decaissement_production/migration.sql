-- CreateTable
CREATE TABLE "DecaissementProduction" (
    "id" TEXT NOT NULL,
    "poste" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "montantTheorique" DOUBLE PRECISION NOT NULL,
    "montantReel" DOUBLE PRECISION NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "datePaiement" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecaissementProduction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DecaissementProduction_poste_periode_key" ON "DecaissementProduction"("poste", "periode");
