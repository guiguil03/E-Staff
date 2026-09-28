-- Jetons aléatoires des liens publics (contrat, paiement) — audit du 2026-09-28.
ALTER TABLE "Registration" ADD COLUMN "lienToken" TEXT,
ADD COLUMN "accesParIdAutorise" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "EvaluationAttempt" ADD COLUMN "lienToken" TEXT,
ADD COLUMN "accesParIdAutorise" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "Registration_lienToken_key" ON "Registration"("lienToken");
CREATE UNIQUE INDEX "EvaluationAttempt_lienToken_key" ON "EvaluationAttempt"("lienToken");

-- Les liens déjà envoyés contiennent l'identifiant : ils restent valables.
UPDATE "Registration" SET "accesParIdAutorise" = true;
UPDATE "EvaluationAttempt" SET "accesParIdAutorise" = true;
