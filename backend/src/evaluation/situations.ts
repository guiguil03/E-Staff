// Banque des 10 mises en situation professionnelles (cahier des charges,
// module d'évaluation, Bloc 3). Le candidat en choisit 5 parmi les 10.
export interface Situation {
  index: number;
  domain: string;
  prompt: string;
}

export const SITUATIONS: Situation[] = [
  {
    index: 1,
    domain: "Vente & Négociation B2B",
    prompt:
      "Levée d'objections (temps/budget) face à un prospect hésitant.",
  },
  {
    index: 2,
    domain: "Conseiller Client",
    prompt: "Désamorcer un client agressif dont le compte est bloqué.",
  },
  {
    index: 3,
    domain: "Humanitaire/ONG",
    prompt:
      "Rassurer un bailleur de fonds sceptique sur la durabilité d'un projet d'accès à l'eau.",
  },
  {
    index: 4,
    domain: "Humanitaire/ONG",
    prompt:
      "Annoncer un report de 24h d'une distribution de vivres à des chefs de village.",
  },
  {
    index: 5,
    domain: "Conseiller Client",
    prompt:
      "Annoncer proactivement un retard de livraison de 72h à un client fidèle.",
  },
  {
    index: 6,
    domain: "Management & RH",
    prompt:
      "Recadrer avec bienveillance un collaborateur compétent mais souvent en retard.",
  },
  {
    index: 7,
    domain: "Communication de crise",
    prompt:
      "Déclaration officielle pour rétablir des faits face à une rumeur sur les réseaux sociaux.",
  },
  {
    index: 8,
    domain: "Executive Presence",
    prompt: "Pitch de présentation percutant en 60 secondes (networking).",
  },
  {
    index: 9,
    domain: "Conseiller Client",
    prompt:
      "Refuser avec diplomatie un délai irréaliste (24h vs 10 jours standard), proposer une alternative.",
  },
  {
    index: 10,
    domain: "Humanitaire/Recrutement",
    prompt:
      "Déconstruire avec pédagogie le préjugé \"les ONG gardent l'argent pour leurs frais de fonctionnement\".",
  },
];

// Grille de correction générique (4 critères x 1 point = 4 points par
// situation). PLACEHOLDER — à remplacer par la grille officielle fournie
// par la cliente (le cahier des charges indique "grille à fournir
// séparément"). Le formateur coche les critères remplis en écoutant
// l'enregistrement ; les points s'additionnent automatiquement.
export const SITUATION_GRADING_CRITERIA = [
  { key: "clarte_structure", label: "Clarté & structure du discours" },
  {
    key: "adequation_ton",
    label:
      "Adéquation au ton attendu (professionnel, empathique ou convaincant selon le rôle)",
  },
  {
    key: "pertinence_contenu",
    label: "Pertinence du contenu par rapport à la situation",
  },
  {
    key: "impact_resolution",
    label: "Impact & résolution (proposition concrète, posture convaincante)",
  },
] as const;
