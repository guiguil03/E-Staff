-- Comptes nominatifs Admin/RH, révocation des sessions, compteurs anti-abus
-- en base (audit du 2026-09-28).
-- AlterTable
ALTER TABLE "Apprenant" ADD COLUMN     "sessionsRevoqueesAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Formateur" ADD COLUMN     "sessionsRevoqueesAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CompteStaff" (
    "id" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "resetToken" TEXT,
    "resetTokenExpiresAt" TIMESTAMP(3),
    "sessionsRevoqueesAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompteStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompteurAbus" (
    "cle" TEXT NOT NULL,
    "compte" INTEGER NOT NULL DEFAULT 0,
    "debutFenetre" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verrouilleJusqua" TIMESTAMP(3),

    CONSTRAINT "CompteurAbus_pkey" PRIMARY KEY ("cle")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompteStaff_matricule_key" ON "CompteStaff"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "CompteStaff_resetToken_key" ON "CompteStaff"("resetToken");
