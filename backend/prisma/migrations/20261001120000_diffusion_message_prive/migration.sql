-- AlterTable
ALTER TABLE "Diffusion" ADD COLUMN     "apprenantId" TEXT;

-- CreateIndex
CREATE INDEX "Diffusion_apprenantId_idx" ON "Diffusion"("apprenantId");

-- AddForeignKey
ALTER TABLE "Diffusion" ADD CONSTRAINT "Diffusion_apprenantId_fkey" FOREIGN KEY ("apprenantId") REFERENCES "Apprenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
