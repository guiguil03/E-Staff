-- AlterTable
ALTER TABLE "Formateur" ADD COLUMN     "password" TEXT,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Formateur_resetToken_key" ON "Formateur"("resetToken");

