-- Rattachement hiérarchique direct Agent -> Superviseur, indépendant des
-- missions (voir Agent.superviseurId dans schema.prisma). Migration écrite
-- à la main (additive uniquement) plutôt que générée par `prisma migrate
-- diff` : la base distante porte des tables/colonnes absentes de ce
-- schéma versionné, qu'on ne touche pas ici.

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN "superviseurId" TEXT;

-- CreateIndex
CREATE INDEX "Agent_superviseurId_idx" ON "Agent"("superviseurId");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_superviseurId_fkey" FOREIGN KEY ("superviseurId") REFERENCES "Superviseur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
