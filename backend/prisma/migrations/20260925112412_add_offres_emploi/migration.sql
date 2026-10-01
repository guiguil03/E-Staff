-- Offres d'emploi de la vitrine Studio Métier (voir schema.prisma,
-- model OffreEmploi) + rattachement optionnel d'une candidature à une offre.
-- Pur ajout, non destructif.

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "listeAttente" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "offreEmploiId" TEXT;

-- CreateTable
CREATE TABLE "OffreEmploi" (
    "id" TEXT NOT NULL,
    "metierSlug" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "drapeau" TEXT,
    "modalites" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "projet" TEXT,
    "remuneration" TEXT,
    "prerequis" TEXT,
    "placesTotal" INTEGER NOT NULL,
    "placesPourvues" INTEGER NOT NULL DEFAULT 0,
    "dateLimite" TIMESTAMP(3),
    "cloturee" BOOLEAN NOT NULL DEFAULT false,
    "publiee" BOOLEAN NOT NULL DEFAULT true,
    "lienWhatsapp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OffreEmploi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OffreEmploi_metierSlug_idx" ON "OffreEmploi"("metierSlug");

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_offreEmploiId_fkey" FOREIGN KEY ("offreEmploiId") REFERENCES "OffreEmploi"("id") ON DELETE SET NULL ON UPDATE CASCADE;
