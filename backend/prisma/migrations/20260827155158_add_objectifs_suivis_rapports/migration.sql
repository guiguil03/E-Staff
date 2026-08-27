-- AlterTable
ALTER TABLE "ContratB2B" ADD COLUMN     "dateSignature" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ObjectifJournalier" (
    "id" TEXT NOT NULL,
    "contratId" TEXT NOT NULL,
    "jour" TIMESTAMP(3) NOT NULL,
    "tauxAtteint" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObjectifJournalier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuiviAgentHebdo" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "semaine" TEXT NOT NULL,
    "concretisations" INTEGER NOT NULL DEFAULT 0,
    "tauxAbsence" DOUBLE PRECISION,
    "nbRetards" INTEGER NOT NULL DEFAULT 0,
    "remarques" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuiviAgentHebdo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RapportHebdoSuperviseur" (
    "id" TEXT NOT NULL,
    "contratId" TEXT NOT NULL,
    "superviseurId" TEXT,
    "semaine" TEXT NOT NULL,
    "constat" TEXT,
    "analyse" TEXT,
    "axesAmelioration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RapportHebdoSuperviseur_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ObjectifJournalier_contratId_jour_key" ON "ObjectifJournalier"("contratId", "jour");

-- CreateIndex
CREATE UNIQUE INDEX "SuiviAgentHebdo_missionId_semaine_key" ON "SuiviAgentHebdo"("missionId", "semaine");

-- CreateIndex
CREATE UNIQUE INDEX "RapportHebdoSuperviseur_contratId_semaine_key" ON "RapportHebdoSuperviseur"("contratId", "semaine");

-- AddForeignKey
ALTER TABLE "ObjectifJournalier" ADD CONSTRAINT "ObjectifJournalier_contratId_fkey" FOREIGN KEY ("contratId") REFERENCES "ContratB2B"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuiviAgentHebdo" ADD CONSTRAINT "SuiviAgentHebdo_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RapportHebdoSuperviseur" ADD CONSTRAINT "RapportHebdoSuperviseur_contratId_fkey" FOREIGN KEY ("contratId") REFERENCES "ContratB2B"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RapportHebdoSuperviseur" ADD CONSTRAINT "RapportHebdoSuperviseur_superviseurId_fkey" FOREIGN KEY ("superviseurId") REFERENCES "Superviseur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
