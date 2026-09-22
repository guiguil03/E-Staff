-- Champ d'audit pour la purge RGPD manuelle d'un candidat (voir
-- RhService.purgeCandidatData) — nullable, non destructif.
ALTER TABLE "Candidat" ADD COLUMN IF NOT EXISTS "dataPurgedAt" TIMESTAMP(3);
