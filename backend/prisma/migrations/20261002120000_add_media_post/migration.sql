-- Mur des Performances & Médias (voir schema.prisma, model MediaPost) —
-- photos/vidéos publiées par la RH. Pur ajout, non destructif.

-- CreateTable
CREATE TABLE "MediaPost" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "caption" TEXT,
    "auteur" TEXT,
    "publiee" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MediaPost_publiee_idx" ON "MediaPost"("publiee");
