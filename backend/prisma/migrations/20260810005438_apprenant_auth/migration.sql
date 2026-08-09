-- AlterTable
ALTER TABLE "Apprenant" ADD COLUMN     "password" TEXT,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Apprenant_resetToken_key" ON "Apprenant"("resetToken");

