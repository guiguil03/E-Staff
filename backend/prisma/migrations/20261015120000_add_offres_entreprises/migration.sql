-- CreateTable
CREATE TABLE "LotEntreprise" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "mission" TEXT NOT NULL,
    "dateFinFormation" TIMESTAMP(3) NOT NULL,
    "segment" TEXT NOT NULL,
    "statutLabel" TEXT NOT NULL DEFAULT 'En attente de déploiement',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "publie" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LotEntreprise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionEntreprise" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "sousTitre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "detailStatut" TEXT NOT NULL,
    "ctaLabel" TEXT NOT NULL DEFAULT 'Démarrer ce projet',
    "segment" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "publie" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissionEntreprise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LotEntreprise_segment_key" ON "LotEntreprise"("segment");

-- CreateIndex
CREATE UNIQUE INDEX "MissionEntreprise_segment_key" ON "MissionEntreprise"("segment");

-- Seed : contenu actuel de la page /entreprises (ex-tableaux codés en dur).
INSERT INTO "LotEntreprise" ("id","nom","mission","dateFinFormation","segment","ordre","updatedAt") VALUES
('lot_seed_setters','Lot de 10 "Setters"','Saturez vos agendas, brisez les barrières et qualifiez un maximum de prospects pour remplir votre pipeline commercial.','2026-08-15','lot-setters',0,CURRENT_TIMESTAMP),
('lot_seed_closers','Lot de 10 "Closers"','Maîtrisez la négociation à fort impact, éliminez les dernières objections et transformez vos prospects chauds en cash immédiat.','2026-08-18','lot-closers',1,CURRENT_TIMESTAMP),
('lot_seed_collecte','Lot de 10 "Campagnes Collecte de Dons"','Maniez la persuasion avec une rigueur absolue pour convaincre, engager et décrocher des prélèvements automatiques et des dons à fort volume.','2026-08-25','lot-collecte-dons',2,CURRENT_TIMESTAMP),
('lot_seed_mailing','Lot de 10 "Campagnes & Mailing"','Inondez les boîtes de réception et pilotez des campagnes de prospection écrite à haut taux de conversion.','2026-09-01','lot-campagnes-mailing',3,CURRENT_TIMESTAMP),
('lot_seed_telephoniques','Lot de 10 "Opérateurs Téléphoniques & Support"','Maîtrisez la voix, encadrez chaque interaction et gérez vos flux de support et d''appels massifs sans fausse note.','2026-08-10','lot-operateurs-telephoniques',4,CURRENT_TIMESTAMP),
('lot_seed_saisie','Lot de 10 "Opérateurs de Saisie & Back-Office"','Alimentez vos CRM, nettoyez vos fichiers et garantissez une rigueur administrative infaillible.','2026-08-20','lot-saisie-back-office',5,CURRENT_TIMESTAMP);

INSERT INTO "MissionEntreprise" ("id","titre","sousTitre","description","disponible","detailStatut","ctaLabel","segment","ordre","updatedAt") VALUES
('mis_seed_voix_off','Voix Off','L''Autorité Vocale','Ne confiez pas votre image à une voix sans relief. Dominez l''attention dès la première seconde sur vos spots publicitaires, modules e-learning ou vidéos de vente.',true,'Livraison sous 24/48h.','Démarrer ce projet','mission-voix-off',0,CURRENT_TIMESTAMP),
('mis_seed_montage','Montage Vidéo','Le Rythme qui Perce','Captivez les algorithmes et pulvérisez l''attention. Du format court (TikTok, Reels, Shorts) au montage institutionnel.',true,'Livraison rapide, délai communiqué sur devis.','Démarrer ce projet','mission-montage-video',1,CURRENT_TIMESTAMP),
('mis_seed_assistanat','Assistanat Virtuel','Le Sceau de l''Exécutif','Vous êtes dirigeant, pas secrétaire. Libérez votre temps stratégique en déléguant la gestion d''agendas complexes et le filtrage d''urgence à une élite rigoureuse.',false,'Prochain créneau : 10 Août 2026.','Réserver mon créneau','mission-assistanat-virtuel',2,CURRENT_TIMESTAMP),
('mis_seed_copywriting','Copywriting & Rédaction','Les Mots qui Frappent','Pages de vente, e-mails et scripts rédigés pour convertir, pas seulement pour être lus.',true,'Disponible immédiatement.','Démarrer ce projet','mission-copywriting',3,CURRENT_TIMESTAMP);
