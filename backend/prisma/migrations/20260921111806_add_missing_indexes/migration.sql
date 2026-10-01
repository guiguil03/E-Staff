-- Index manquants sur les clés étrangères hors préfixe gauche d'un
-- @@unique/@@id existant (voir schema.prisma) : sans eux, Postgres fait un
-- scan séquentiel de la table entière à chaque requête filtrée par ces
-- colonnes. Pur ajout, non destructif, aucune donnée touchée.

-- Candidat
CREATE INDEX IF NOT EXISTS "Candidat_agentAcquisitionId_idx" ON "Candidat"("agentAcquisitionId");

-- EvaluationAttempt
CREATE INDEX IF NOT EXISTS "EvaluationAttempt_candidatId_idx" ON "EvaluationAttempt"("candidatId");

-- Groupe
CREATE INDEX IF NOT EXISTS "Groupe_formateurId_idx" ON "Groupe"("formateurId");

-- Diffusion
CREATE INDEX IF NOT EXISTS "Diffusion_formateurId_idx" ON "Diffusion"("formateurId");
CREATE INDEX IF NOT EXISTS "Diffusion_groupeId_idx" ON "Diffusion"("groupeId");

-- BilanFormateur
CREATE INDEX IF NOT EXISTS "BilanFormateur_formateurId_idx" ON "BilanFormateur"("formateurId");

-- FormateurDocument
CREATE INDEX IF NOT EXISTS "FormateurDocument_formateurId_idx" ON "FormateurDocument"("formateurId");

-- Apprenant
CREATE INDEX IF NOT EXISTS "Apprenant_groupeId_idx" ON "Apprenant"("groupeId");
CREATE INDEX IF NOT EXISTS "Apprenant_connecteurId_idx" ON "Apprenant"("connecteurId");
CREATE INDEX IF NOT EXISTS "Apprenant_agentAcquisitionId_idx" ON "Apprenant"("agentAcquisitionId");

-- Reinscription
CREATE INDEX IF NOT EXISTS "Reinscription_apprenantId_idx" ON "Reinscription"("apprenantId");

-- Notation (seanceId déjà couvert par l'index du @@unique([seanceId, apprenantId, competence]))
CREATE INDEX IF NOT EXISTS "Notation_apprenantId_idx" ON "Notation"("apprenantId");

-- Presence
CREATE INDEX IF NOT EXISTS "Presence_seanceId_idx" ON "Presence"("seanceId");
CREATE INDEX IF NOT EXISTS "Presence_apprenantId_idx" ON "Presence"("apprenantId");

-- PerformanceSuperviseurClient (superviseurId déjà couvert par l'index du @@unique)
CREATE INDEX IF NOT EXISTS "PerformanceSuperviseurClient_contratId_idx" ON "PerformanceSuperviseurClient"("contratId");

-- ContratB2B
CREATE INDEX IF NOT EXISTS "ContratB2B_entrepriseProjetId_idx" ON "ContratB2B"("entrepriseProjetId");
CREATE INDEX IF NOT EXISTS "ContratB2B_connecteurId_idx" ON "ContratB2B"("connecteurId");

-- Mission
CREATE INDEX IF NOT EXISTS "Mission_apprenantId_idx" ON "Mission"("apprenantId");
CREATE INDEX IF NOT EXISTS "Mission_contratId_idx" ON "Mission"("contratId");
CREATE INDEX IF NOT EXISTS "Mission_superviseurId_idx" ON "Mission"("superviseurId");

-- Facture
CREATE INDEX IF NOT EXISTS "Facture_contratId_idx" ON "Facture"("contratId");

-- RapportHebdoSuperviseur (contratId déjà couvert par l'index du @@unique([contratId, semaine]))
CREATE INDEX IF NOT EXISTS "RapportHebdoSuperviseur_superviseurId_idx" ON "RapportHebdoSuperviseur"("superviseurId");

-- CommissionDemarrageApporteur
CREATE INDEX IF NOT EXISTS "CommissionDemarrageApporteur_connecteurId_idx" ON "CommissionDemarrageApporteur"("connecteurId");

-- EncaissementFormation
CREATE INDEX IF NOT EXISTS "EncaissementFormation_apprenantId_idx" ON "EncaissementFormation"("apprenantId");
