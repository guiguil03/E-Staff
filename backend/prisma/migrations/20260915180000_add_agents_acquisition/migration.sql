-- CreateTable
CREATE TABLE "AgentAcquisition" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentAcquisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reinscription" (
    "id" TEXT NOT NULL,
    "apprenantId" TEXT NOT NULL,
    "renouveleLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nouvelleEcheance" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reinscription_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Candidat" ADD COLUMN     "agentAcquisitionId" TEXT;

-- AlterTable
ALTER TABLE "Apprenant" ADD COLUMN     "agentAcquisitionId" TEXT;

-- AddForeignKey
ALTER TABLE "Candidat" ADD CONSTRAINT "Candidat_agentAcquisitionId_fkey" FOREIGN KEY ("agentAcquisitionId") REFERENCES "AgentAcquisition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Apprenant" ADD CONSTRAINT "Apprenant_agentAcquisitionId_fkey" FOREIGN KEY ("agentAcquisitionId") REFERENCES "AgentAcquisition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reinscription" ADD CONSTRAINT "Reinscription_apprenantId_fkey" FOREIGN KEY ("apprenantId") REFERENCES "Apprenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
