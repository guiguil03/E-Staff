// Valeurs de statut stockées comme String en base (SQLite ne supporte pas
// les enums Prisma natifs — voir prisma/schema.prisma).

export type EntrepriseProjetStatus =
  | "nouveau"
  | "contacte"
  | "qualifie"
  | "converti";

export type ConnecteurStatus = "nouveau" | "contacte" | "actif";

export type EvaluationAttemptStatus =
  | "en_cours"
  | "soumis"
  | "en_correction"
  | "corrige"
  | "resultat_envoye";

export type EvaluationTier =
  | "refuse"
  | "formation_b1"
  | "niveau_b2"
  | "niveau_c1"
  | "placement_direct";

export const SERVICE_TYPES = [
  "Squad commerciale",
  "Support client",
  "Collecte de dons",
  "Saisie / Back-office",
  "Voix off",
  "Montage",
  "Copywriting",
] as const;

export const ACTIVITY_TYPES = [
  "Cabinet de recrutement / Chasseur de têtes",
  "Consultant RH / Business Developer B2B",
  "Agence (Marketing, Vente, Tech)",
  "Autre réseau B2B",
] as const;

export const CLIENT_COUNT_RANGES = ["1 à 5", "5 à 15", "Plus de 15"] as const;

export const SOUGHT_ROLES = [
  "Prospection & Vente (Setters/Closers)",
  "Support client & Téléphonie",
  "Back-Office & Saisie de données",
  "Campagnes de prospection / Mailing",
  "Prestations ponctuelles (Voix off, Montage vidéo, Copywriting)",
] as const;

export const CV_VOLUME_RANGES = [
  "Moins de 50",
  "50 à 200",
  "Plus de 200",
] as const;

export const BUDGET_RANGES = [
  "Moins de 500 €",
  "500 € – 1 000 €",
  "Plus de 1 000 €",
] as const;

export const PRESENTATION_MODES = [
  "Recommandation directe",
  "Présentation conjointe (RDV à trois)",
  "Marque blanche / Revente intégrée",
] as const;

export const PAYMENT_CHANNELS = [
  "Virement bancaire (IBAN/SEPA/SWIFT)",
  "Mobile Money (Orange Money, Mvola, Airtel...)",
  "Stripe / PayPal / Wise",
] as const;

export const OPPORTUNITY_TIMINGS = [
  "Oui, besoin immédiat",
  "Oui, d'ici 1 à 3 mois",
  "Non, je souhaite d'abord échanger lors du RDV",
] as const;
