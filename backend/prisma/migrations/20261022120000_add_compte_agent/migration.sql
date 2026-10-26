-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "password" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiresAt" TIMESTAMP(3),
    "sessionsRevoqueesAt" TIMESTAMP(3),
    "statut" TEXT NOT NULL DEFAULT 'essai',
    "poste" TEXT,
    "dateEmbauche" TIMESTAMP(3),
    "salaireBase" DOUBLE PRECISION,
    "ribOuMobileMoney" TEXT,
    "moyenPaiementType" TEXT,
    "coordonneesVerifieesLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentDocument" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuiviAgentJournalier" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "jour" TIMESTAMP(3) NOT NULL,
    "realise" INTEGER,
    "tauxAtteint" DOUBLE PRECISION NOT NULL,
    "heuresTravaillees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remarques" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuiviAgentJournalier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_matricule_key" ON "Agent"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_resetToken_key" ON "Agent"("resetToken");

-- CreateIndex
CREATE INDEX "AgentDocument_agentId_idx" ON "AgentDocument"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "SuiviAgentJournalier_missionId_jour_key" ON "SuiviAgentJournalier"("missionId", "jour");

-- AlterTable
-- Titulaire de la mission : un Agent (nouveau compte) OU un Apprenant
-- (missions déjà en base, créées quand un agent n'existait que comme
-- apprenant diplômé) — d'où apprenantId qui devient nullable.
ALTER TABLE "Mission" ADD COLUMN "agentId" TEXT,
ADD COLUMN "objectifJournalier" INTEGER,
ADD COLUMN "objectifHebdo" INTEGER;

ALTER TABLE "Mission" ALTER COLUMN "apprenantId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Mission_agentId_idx" ON "Mission"("agentId");

-- AddForeignKey
ALTER TABLE "AgentDocument" ADD CONSTRAINT "AgentDocument_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuiviAgentJournalier" ADD CONSTRAINT "SuiviAgentJournalier_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
