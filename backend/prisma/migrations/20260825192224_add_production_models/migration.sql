-- CreateTable
CREATE TABLE "Superviseur" (
    "id" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "Superviseur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContratB2B" (
    "id" TEXT NOT NULL,
    "clientNom" TEXT NOT NULL,
    "entrepriseProjetId" TEXT,
    "description" TEXT,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "statut" TEXT NOT NULL DEFAULT 'actif',
    "tarifMensuel" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContratB2B_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "apprenantId" TEXT NOT NULL,
    "contratId" TEXT NOT NULL,
    "superviseurId" TEXT,
    "role" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "qualityScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facture" (
    "id" TEXT NOT NULL,
    "contratId" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'emise',
    "dateEmission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "datePaiement" TIMESTAMP(3),

    CONSTRAINT "Facture_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Superviseur_matricule_key" ON "Superviseur"("matricule");

-- AddForeignKey
ALTER TABLE "ContratB2B" ADD CONSTRAINT "ContratB2B_entrepriseProjetId_fkey" FOREIGN KEY ("entrepriseProjetId") REFERENCES "EntrepriseProjet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_apprenantId_fkey" FOREIGN KEY ("apprenantId") REFERENCES "Apprenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_contratId_fkey" FOREIGN KEY ("contratId") REFERENCES "ContratB2B"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_superviseurId_fkey" FOREIGN KEY ("superviseurId") REFERENCES "Superviseur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facture" ADD CONSTRAINT "Facture_contratId_fkey" FOREIGN KEY ("contratId") REFERENCES "ContratB2B"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
