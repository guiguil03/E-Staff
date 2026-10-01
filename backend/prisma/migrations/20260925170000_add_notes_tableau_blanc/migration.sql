-- Notes privées du formateur et tableau blanc partagé des classes virtuelles
-- (voir schema.prisma : NoteFormateur, TableauBlanc, TableauFichier).
-- Pur ajout, non destructif.

-- CreateTable
CREATE TABLE "NoteFormateur" (
    "id" TEXT NOT NULL,
    "seanceId" TEXT NOT NULL,
    "apprenantId" TEXT,
    "contenu" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoteFormateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableauBlanc" (
    "seanceId" TEXT NOT NULL,
    "elements" TEXT NOT NULL DEFAULT '[]',
    "version" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TableauBlanc_pkey" PRIMARY KEY ("seanceId")
);

-- CreateTable
CREATE TABLE "TableauFichier" (
    "seanceId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TableauFichier_pkey" PRIMARY KEY ("seanceId","fileId")
);

-- CreateIndex
CREATE UNIQUE INDEX "NoteFormateur_seanceId_apprenantId_key" ON "NoteFormateur"("seanceId", "apprenantId");

-- AddForeignKey
ALTER TABLE "NoteFormateur" ADD CONSTRAINT "NoteFormateur_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "Seance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteFormateur" ADD CONSTRAINT "NoteFormateur_apprenantId_fkey" FOREIGN KEY ("apprenantId") REFERENCES "Apprenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableauBlanc" ADD CONSTRAINT "TableauBlanc_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "Seance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableauFichier" ADD CONSTRAINT "TableauFichier_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "TableauBlanc"("seanceId") ON DELETE CASCADE ON UPDATE CASCADE;
