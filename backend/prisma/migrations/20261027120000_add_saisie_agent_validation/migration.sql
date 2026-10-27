-- AlterTable
ALTER TABLE "Agent" ADD COLUMN "statutPresence" TEXT NOT NULL DEFAULT 'hors_ligne',
ADD COLUMN "statutPresenceDepuis" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "SuiviAgentJournalier" ADD COLUMN "heuresPanne" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "statutValidation" TEXT NOT NULL DEFAULT 'a_valider',
ADD COLUMN "commentaireSuperviseur" TEXT,
ADD COLUMN "valideLe" TIMESTAMP(3);

-- Les relevés saisis avant cette migration l'ont été par la RH : déjà validés.
UPDATE "SuiviAgentJournalier" SET "statutValidation" = 'valide', "valideLe" = "createdAt";
