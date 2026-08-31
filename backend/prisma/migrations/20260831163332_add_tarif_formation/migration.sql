-- CreateTable
CREATE TABLE "TarifFormation" (
    "id" TEXT NOT NULL,
    "typeCours" TEXT NOT NULL,
    "prixFormation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TarifFormation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TarifFormation_typeCours_key" ON "TarifFormation"("typeCours");
