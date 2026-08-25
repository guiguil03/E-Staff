-- AlterTable
ALTER TABLE "Groupe" ADD COLUMN     "formateurId" TEXT;

-- AddForeignKey
ALTER TABLE "Groupe" ADD CONSTRAINT "Groupe_formateurId_fkey" FOREIGN KEY ("formateurId") REFERENCES "Formateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
