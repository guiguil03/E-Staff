-- CreateTable
CREATE TABLE "SupportCours" (
    "id" TEXT NOT NULL,
    "formateurId" TEXT NOT NULL,
    "groupeId" TEXT NOT NULL,
    "seanceNumero" INTEGER,
    "filename" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportCours_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SupportCours" ADD CONSTRAINT "SupportCours_formateurId_fkey" FOREIGN KEY ("formateurId") REFERENCES "Formateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportCours" ADD CONSTRAINT "SupportCours_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "Groupe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
