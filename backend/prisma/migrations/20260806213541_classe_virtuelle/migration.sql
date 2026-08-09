-- CreateTable
CREATE TABLE "Groupe" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "Groupe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Formateur" (
    "id" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "Formateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Apprenant" (
    "id" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "groupeId" TEXT NOT NULL,

    CONSTRAINT "Apprenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seance" (
    "id" TEXT NOT NULL,
    "groupeId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "startAt" TIMESTAMP(3),
    "dureeMinutes" INTEGER NOT NULL DEFAULT 90,
    "objectifs" TEXT,
    "dailyRoomName" TEXT,
    "dailyRoomUrl" TEXT,
    "rappelJ1EnvoyeAt" TIMESTAMP(3),
    "rappel15minEnvoyeAt" TIMESTAMP(3),

    CONSTRAINT "Seance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Groupe_cle_key" ON "Groupe"("cle");

-- CreateIndex
CREATE UNIQUE INDEX "Formateur_matricule_key" ON "Formateur"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "Apprenant_matricule_key" ON "Apprenant"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "Seance_groupeId_numero_key" ON "Seance"("groupeId", "numero");

-- AddForeignKey
ALTER TABLE "Apprenant" ADD CONSTRAINT "Apprenant_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "Groupe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seance" ADD CONSTRAINT "Seance_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "Groupe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

