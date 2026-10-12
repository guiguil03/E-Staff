-- Audit scalabilité du 2026-10-08 : trois colonnes de filtre fréquemment
-- interrogées sans index, sur des modèles qui grossissent avec le nombre
-- d'apprenants/candidats/inscriptions (contrairement aux modèles de
-- configuration à volume fixe). Pur ajout, non destructif.

-- EvaluationAttempt.status : filtre le plus utilisé du modèle (file de
-- correction, pipeline RH, compteur de l'overview RH).
CREATE INDEX IF NOT EXISTS "EvaluationAttempt_status_idx" ON "EvaluationAttempt"("status");

-- Mission.dateFin : "WHERE dateFin IS NULL" (missions actives) sur les
-- overview Production/RH, sans filtre en amont.
CREATE INDEX IF NOT EXISTS "Mission_dateFin_idx" ON "Mission"("dateFin");

-- Registration.offreEmploiId : un COUNT(*) par offre d'emploi affichée,
-- sur une table qui agrège tous les funnels d'inscription (DELF/DALF, TEF,
-- DFP, FOL, Studio Métier), bien plus nombreux que les offres elles-mêmes.
CREATE INDEX IF NOT EXISTS "Registration_offreEmploiId_idx" ON "Registration"("offreEmploiId");
