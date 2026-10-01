-- CreateTable
CREATE TABLE "BilanFormateur" (
    "id" TEXT NOT NULL,
    "formateurId" TEXT NOT NULL,
    "constat" TEXT NOT NULL,
    "analyse" TEXT NOT NULL,
    "axes" TEXT NOT NULL,
    "statsSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BilanFormateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormateurDocument" (
    "id" TEXT NOT NULL,
    "formateurId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormateurDocument_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BilanFormateur" ADD CONSTRAINT "BilanFormateur_formateurId_fkey" FOREIGN KEY ("formateurId") REFERENCES "Formateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormateurDocument" ADD CONSTRAINT "FormateurDocument_formateurId_fkey" FOREIGN KEY ("formateurId") REFERENCES "Formateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

