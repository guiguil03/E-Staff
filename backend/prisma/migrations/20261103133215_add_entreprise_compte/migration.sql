-- AlterTable
ALTER TABLE "ContratB2B" ADD COLUMN     "entrepriseId" TEXT;

-- CreateTable
CREATE TABLE "Entreprise" (
    "id" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "raisonSociale" TEXT NOT NULL,
    "contactNom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'actif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entreprise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompteEntreprise" (
    "id" TEXT NOT NULL,
    "entrepriseId" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "resetToken" TEXT,
    "resetTokenExpiresAt" TIMESTAMP(3),
    "sessionsRevoqueesAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompteEntreprise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InteretVivier" (
    "id" TEXT NOT NULL,
    "entrepriseId" TEXT NOT NULL,
    "contratId" TEXT,
    "agentId" TEXT,
    "apprenantId" TEXT,
    "posteSouhaite" TEXT,
    "message" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'nouveau',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InteretVivier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntretienVirtuel" (
    "id" TEXT NOT NULL,
    "entrepriseId" TEXT NOT NULL,
    "interetVivierId" TEXT,
    "titre" TEXT NOT NULL,
    "startAt" TIMESTAMP(3),
    "dureeMinutes" INTEGER NOT NULL DEFAULT 30,
    "dailyRoomName" TEXT,
    "dailyRoomUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntretienVirtuel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportFormationEntreprise" (
    "id" TEXT NOT NULL,
    "entrepriseId" TEXT NOT NULL,
    "contratId" TEXT,
    "filename" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportFormationEntreprise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntrepriseDocument" (
    "id" TEXT NOT NULL,
    "entrepriseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntrepriseDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageEntreprise" (
    "id" TEXT NOT NULL,
    "entrepriseId" TEXT NOT NULL,
    "contratId" TEXT,
    "auteur" TEXT NOT NULL,
    "texte" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageEntreprise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntrepriseLive" (
    "id" TEXT NOT NULL,
    "entrepriseId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3),
    "dureeMinutes" INTEGER NOT NULL DEFAULT 60,
    "dailyRoomName" TEXT,
    "dailyRoomUrl" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'planifie',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntrepriseLive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandForum" (
    "id" TEXT NOT NULL,
    "entrepriseId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "presentation" TEXT,
    "offresTexte" TEXT,
    "logoKey" TEXT,
    "creneauxEntretien" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'brouillon',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StandForum_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Entreprise_matricule_key" ON "Entreprise"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "CompteEntreprise_entrepriseId_key" ON "CompteEntreprise"("entrepriseId");

-- CreateIndex
CREATE UNIQUE INDEX "CompteEntreprise_resetToken_key" ON "CompteEntreprise"("resetToken");

-- CreateIndex
CREATE INDEX "InteretVivier_entrepriseId_idx" ON "InteretVivier"("entrepriseId");

-- CreateIndex
CREATE INDEX "InteretVivier_agentId_idx" ON "InteretVivier"("agentId");

-- CreateIndex
CREATE INDEX "InteretVivier_apprenantId_idx" ON "InteretVivier"("apprenantId");

-- CreateIndex
CREATE INDEX "EntretienVirtuel_entrepriseId_idx" ON "EntretienVirtuel"("entrepriseId");

-- CreateIndex
CREATE INDEX "SupportFormationEntreprise_entrepriseId_idx" ON "SupportFormationEntreprise"("entrepriseId");

-- CreateIndex
CREATE INDEX "SupportFormationEntreprise_contratId_idx" ON "SupportFormationEntreprise"("contratId");

-- CreateIndex
CREATE INDEX "EntrepriseDocument_entrepriseId_idx" ON "EntrepriseDocument"("entrepriseId");

-- CreateIndex
CREATE INDEX "MessageEntreprise_entrepriseId_idx" ON "MessageEntreprise"("entrepriseId");

-- CreateIndex
CREATE INDEX "MessageEntreprise_contratId_idx" ON "MessageEntreprise"("contratId");

-- CreateIndex
CREATE INDEX "EntrepriseLive_entrepriseId_idx" ON "EntrepriseLive"("entrepriseId");

-- CreateIndex
CREATE INDEX "StandForum_entrepriseId_idx" ON "StandForum"("entrepriseId");

-- CreateIndex
CREATE INDEX "ContratB2B_entrepriseId_idx" ON "ContratB2B"("entrepriseId");

-- CreateIndex
CREATE INDEX "SupportCours_formateurId_idx" ON "SupportCours"("formateurId");

-- CreateIndex
CREATE INDEX "SupportCours_groupeId_idx" ON "SupportCours"("groupeId");

-- AddForeignKey
ALTER TABLE "ContratB2B" ADD CONSTRAINT "ContratB2B_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompteEntreprise" ADD CONSTRAINT "CompteEntreprise_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteretVivier" ADD CONSTRAINT "InteretVivier_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteretVivier" ADD CONSTRAINT "InteretVivier_contratId_fkey" FOREIGN KEY ("contratId") REFERENCES "ContratB2B"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteretVivier" ADD CONSTRAINT "InteretVivier_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteretVivier" ADD CONSTRAINT "InteretVivier_apprenantId_fkey" FOREIGN KEY ("apprenantId") REFERENCES "Apprenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntretienVirtuel" ADD CONSTRAINT "EntretienVirtuel_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntretienVirtuel" ADD CONSTRAINT "EntretienVirtuel_interetVivierId_fkey" FOREIGN KEY ("interetVivierId") REFERENCES "InteretVivier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportFormationEntreprise" ADD CONSTRAINT "SupportFormationEntreprise_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportFormationEntreprise" ADD CONSTRAINT "SupportFormationEntreprise_contratId_fkey" FOREIGN KEY ("contratId") REFERENCES "ContratB2B"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrepriseDocument" ADD CONSTRAINT "EntrepriseDocument_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageEntreprise" ADD CONSTRAINT "MessageEntreprise_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageEntreprise" ADD CONSTRAINT "MessageEntreprise_contratId_fkey" FOREIGN KEY ("contratId") REFERENCES "ContratB2B"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrepriseLive" ADD CONSTRAINT "EntrepriseLive_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandForum" ADD CONSTRAINT "StandForum_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
