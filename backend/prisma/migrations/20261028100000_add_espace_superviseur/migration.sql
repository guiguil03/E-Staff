-- DropIndex
DROP INDEX "Groupe_formateurId_idx";

-- CreateTable
CREATE TABLE "CompteSuperviseur" (
    "id" TEXT NOT NULL,
    "superviseurId" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "resetToken" TEXT,
    "resetTokenExpiresAt" TIMESTAMP(3),
    "sessionsRevoqueesAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompteSuperviseur_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompteSuperviseur_superviseurId_key" ON "CompteSuperviseur"("superviseurId");

-- CreateIndex
CREATE UNIQUE INDEX "CompteSuperviseur_resetToken_key" ON "CompteSuperviseur"("resetToken");

-- CreateTable
CREATE TABLE "AlerteAgent" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "message" TEXT,
    "creeeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traiteeLe" TIMESTAMP(3),

    CONSTRAINT "AlerteAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageSuperviseur" (
    "id" TEXT NOT NULL,
    "superviseurId" TEXT NOT NULL,
    "agentId" TEXT,
    "texte" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageSuperviseur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReunionSuperviseur" (
    "id" TEXT NOT NULL,
    "superviseurId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "debut" TIMESTAMP(3) NOT NULL,
    "dureeMin" INTEGER NOT NULL DEFAULT 30,
    "type" TEXT NOT NULL,
    "roomName" TEXT,
    "roomUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReunionSuperviseur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReunionParticipant" (
    "id" TEXT NOT NULL,
    "reunionId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "ReunionParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbsenceSuperviseur" (
    "id" TEXT NOT NULL,
    "superviseurId" TEXT NOT NULL,
    "jour" TIMESTAMP(3) NOT NULL,
    "heures" DOUBLE PRECISION NOT NULL,
    "justifiee" BOOLEAN NOT NULL DEFAULT false,
    "motif" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbsenceSuperviseur_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlerteAgent_agentId_traiteeLe_idx" ON "AlerteAgent"("agentId", "traiteeLe");

-- CreateIndex
CREATE INDEX "MessageSuperviseur_superviseurId_createdAt_idx" ON "MessageSuperviseur"("superviseurId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageSuperviseur_agentId_createdAt_idx" ON "MessageSuperviseur"("agentId", "createdAt");

-- CreateIndex
CREATE INDEX "ReunionSuperviseur_superviseurId_debut_idx" ON "ReunionSuperviseur"("superviseurId", "debut");

-- CreateIndex
CREATE INDEX "ReunionParticipant_agentId_idx" ON "ReunionParticipant"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "ReunionParticipant_reunionId_agentId_key" ON "ReunionParticipant"("reunionId", "agentId");

-- CreateIndex
CREATE INDEX "AbsenceSuperviseur_superviseurId_jour_idx" ON "AbsenceSuperviseur"("superviseurId", "jour");

-- AddForeignKey
ALTER TABLE "CompteSuperviseur" ADD CONSTRAINT "CompteSuperviseur_superviseurId_fkey" FOREIGN KEY ("superviseurId") REFERENCES "Superviseur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlerteAgent" ADD CONSTRAINT "AlerteAgent_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageSuperviseur" ADD CONSTRAINT "MessageSuperviseur_superviseurId_fkey" FOREIGN KEY ("superviseurId") REFERENCES "Superviseur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageSuperviseur" ADD CONSTRAINT "MessageSuperviseur_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReunionSuperviseur" ADD CONSTRAINT "ReunionSuperviseur_superviseurId_fkey" FOREIGN KEY ("superviseurId") REFERENCES "Superviseur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReunionParticipant" ADD CONSTRAINT "ReunionParticipant_reunionId_fkey" FOREIGN KEY ("reunionId") REFERENCES "ReunionSuperviseur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReunionParticipant" ADD CONSTRAINT "ReunionParticipant_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsenceSuperviseur" ADD CONSTRAINT "AbsenceSuperviseur_superviseurId_fkey" FOREIGN KEY ("superviseurId") REFERENCES "Superviseur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

