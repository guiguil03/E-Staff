-- CreateTable
CREATE TABLE "Diffusion" (
    "id" TEXT NOT NULL,
    "formateurId" TEXT NOT NULL,
    "groupeId" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Diffusion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Diffusion" ADD CONSTRAINT "Diffusion_formateurId_fkey" FOREIGN KEY ("formateurId") REFERENCES "Formateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diffusion" ADD CONSTRAINT "Diffusion_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "Groupe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
