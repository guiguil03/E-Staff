// Banque des 10 mises en situation professionnelles (Bloc 3, barème officiel
// fourni par la cliente 2026-08-04 : "bareme_notation_bloc3_mises_en_situation.pdf"
// pour la grille de notation, contenu détaillé Contexte/Mission fourni le
// même jour). Le candidat en choisit 5 parmi les 10.
export interface Situation {
  index: number;
  domain: string;
  /** Le décor de la situation — ce que vit le candidat avant de répondre. */
  context: string;
  /** L'instruction précise donnée au candidat pour son enregistrement. */
  mission: string;
}

export const SITUATIONS: Situation[] = [
  {
    index: 1,
    domain: "Vente & Négociation B2B — Levée d'objections",
    context:
      "Vous êtes chargé d'affaires. Un prospect s'intéresse à vos services mais hésite : « Votre offre est intéressante, mais nos équipes n'ont pas le temps en ce moment et votre tarif dépasse notre budget initial. »",
    mission:
      "Enregistrez votre réponse pour lever les objections (temps et budget) et décrocher un rendez-vous d'approfondissement.",
  },
  {
    index: 2,
    domain: "Conseiller Client — Client agressif au téléphone",
    context:
      "Vous êtes conseiller client. Un utilisateur vous appelle très agacé : son compte est bloqué depuis ce matin, ce qui l'empêche de travailler. Il hausse le ton et exige un déblocage immédiat.",
    mission:
      "Enregistrez votre prise de parole pour désamorcer l'agressivité du client, faire preuve d'empathie, garder votre calme et lui expliquer la procédure de résolution étape par étape.",
  },
  {
    index: 3,
    domain: "Humanitaire/ONG — Mobilisation de bailleurs ou partenaires",
    context:
      "Vous êtes responsable des relations partenaires pour une ONG. Vous rencontrez un bailleur de fonds potentiel qui doute de la durabilité de votre projet d'accès à l'eau potable dans une zone rurale.",
    mission:
      "Enregistrez votre argumentation pour rassurer le bailleur sur la pérennité du projet, l'implication des communautés locales et l'impact mesurable sur le long terme.",
  },
  {
    index: 4,
    domain: "Humanitaire/ONG — Gestion d'urgence sur le terrain",
    context:
      "Chef de projet humanitaire, vous devez expliquer à des chefs de village locaux que la distribution de vivres initialement prévue ce matin doit être décalée de 24 heures pour des raisons de sécurité de la zone.",
    mission:
      "Enregistrez votre message oral destiné aux représentants communautaires : faites preuve de diplomatie, de clarté, de respect des autorités locales tout en maintenant la confiance.",
  },
  {
    index: 5,
    domain: "Conseiller Client — Annonce d'un retard de livraison",
    context:
      "Vous devez appeler proactivement un client fidèle pour lui annoncer que sa commande prioritaire subit un retard d'expédition de 72 heures en raison d'un problème logistique.",
    mission:
      "Enregistrez votre appel : annoncez la mauvaise nouvelle de manière transparente, présentez les excuses de la structure et proposez un geste commercial ou un suivi personnalisé.",
  },
  {
    index: 6,
    domain: "Management & RH — Recadrage d'un collaborateur",
    context:
      "Responsable d'équipe, vous constatez qu'un collaborateur très compétent arrive systématiquement en retard aux réunions d'équipe, ce qui perturbe l'organisation.",
    mission:
      "Enregistrez l'entretien individuel : exprimez votre constat avec bienveillance, expliquez l'impact négatif sur l'équipe et amenez-le à s'engager sur une solution.",
  },
  {
    index: 7,
    domain: "Communication d'urgence / Gestion de crise",
    context:
      "Une rumeur ou une fausse information circule sur les réseaux sociaux concernant la gestion des fonds de votre organisation / entreprise.",
    mission:
      "Enregistrez une courte déclaration orale officielle pour rétablir les faits avec fermeté, clarté et professionnalisme, en réaffirmant les valeurs de transparence de votre structure.",
  },
  {
    index: 8,
    domain: "Executive Presence — Pitch de présentation de 60 secondes",
    context:
      "Lors d'un événement de networking, un responsable important vous demande : « Que faites-vous exactement et quelle est la valeur ajoutée de vos services / de votre organisation ? »",
    mission:
      "Enregistrez un pitch percutant d'une minute pour vous présenter, valoriser votre expertise et inciter à une prise de contact ultérieure.",
  },
  {
    index: 9,
    domain: "Conseiller Client — Gestion d'une demande irréaliste",
    context:
      "Un client exige l'exécution d'une prestation complète en 24 heures, alors que le délai standard incompressible est de 10 jours.",
    mission:
      "Enregistrez votre réponse orale pour lui refuser le délai irréaliste avec diplomatie, tout en lui proposant une solution intermédiaire (ex. livraison d'une première phase urgente).",
  },
  {
    index: 10,
    domain: "Humanitaire/Recrutement — Sensibilisation du grand public",
    context:
      "En tant que recruteur de donateurs pour une cause humanitaire (santé, éducation ou environnement), vous abordez une personne dans la rue ou lors d'un événement qui vous dit : « Les ONG gardent l'argent pour leurs frais de fonctionnement, ça ne sert à rien. »",
    mission:
      "Enregistrez votre réponse pour déconstruire ce préjugé avec pédagogie, expliquer la répartition réelle du budget et réengager la personne dans la cause.",
  },
];

// Grille officielle de notation du Bloc 3 (barème fourni par la cliente,
// 2026-08-04 : "bareme_notation_bloc3_mises_en_situation.pdf").
//
// Chaque situation est notée sur 4 critères universels. Contrairement à une
// simple case à cocher, chaque critère se note sur 4 échelons stricts
// (0.25 / 0.50 / 0.75 / 1.00 point) — le formateur choisit un seul échelon
// par critère en écoutant l'enregistrement, les points s'additionnent
// automatiquement (max 1.00 pt/critère × 4 critères = 4.00 pts/situation,
// × 5 situations = 20.00 pts pour le Bloc 3).
export const GRADING_LEVELS = [
  { value: 0.25, label: "Insuffisant" },
  { value: 0.5, label: "Passable" },
  { value: 0.75, label: "Bon" },
  { value: 1, label: "Excellent" },
] as const;

export type GradingLevelValue = (typeof GRADING_LEVELS)[number]["value"];

export interface GradingCriterion {
  key: string;
  label: string;
  description: string;
  // Descripteur détaillé par échelon — aide le formateur à choisir le bon
  // niveau en écoutant l'enregistrement.
  descriptors: Record<"0.25" | "0.5" | "0.75" | "1", string>;
}

export const SITUATION_GRADING_CRITERIA: GradingCriterion[] = [
  {
    key: "posture",
    label: "Posture & Empathie Professionnelle",
    description:
      "Ton, gestion de la relation, posture pro (Vente, Service client, ONG)",
    descriptors: {
      "0.25":
        "Ton agressif, rigide, trop familier ou inadapté à l'interlocuteur. Absence d'écoute ou d'empathie.",
      "0.5":
        "Ton neutre ou hésitant ; manque d'assurance face au client/prospect ou manque d'empathie en situation de crise.",
      "0.75":
        "Posture professionnelle correcte, ton respectueux et adapté. Bonne capacité d'écoute et d'ajustement.",
      "1": "Posture remarquable. Maîtrise relationnelle parfaite (assurance en vente, grande empathie en service client/ONG).",
    },
  },
  {
    key: "structure",
    label: "Structure & Logique d'Argumentation",
    description: "Accroche, traitement du problème, proposition, appel à l'action",
    descriptors: {
      "0.25":
        "Propos confus, sans fil conducteur. Réponse hors-sujet, tronquée ou désordonnée.",
      "0.5":
        "Arguments présentés mais mal organisés. Oubli de valider l'accord de l'interlocuteur ou pas d'appel à l'action.",
      "0.75":
        "Structure claire (accueil, explication, proposition, conclusion). Déroulé logique et cohérent.",
      "1": "Structure percutante et parfaite. Argumentation fluide, traitement sans accroc des objections, conclusion nette.",
    },
  },
  {
    key: "fluidite",
    label: "Aisance, Intonation & Fluidité Orale",
    description: "Débit, articulation, dynamisme, absence de pauses ou de tics",
    descriptors: {
      "0.25":
        "Débit très saccadé, nombreuses hésitations (\"euh...\"), voix monocorde ou inaudible.",
      "0.5":
        "Débit hésitant par moments, rythme haché, tics de langage perceptibles mais message compréhensible.",
      "0.75":
        "Bonne élocution, articulation claire, rythme naturel avec très peu d'hésitations.",
      "1": "Aisance orale remarquable, intonation chaleureuse et engageante, maîtrise dynamique du discours.",
    },
  },
  {
    key: "vocabulaire",
    label: "Richesse du Vocabulaire & Langue",
    description: "Registre professionnel, précision B2/C1, correction syntaxique",
    descriptors: {
      "0.25":
        "Vocabulaire très pauvre ou inadapté. Fautes de syntaxe et de grammaire fréquentes à l'oral.",
      "0.5":
        "Vocabulaire basique mais correct. Syntaxiquement acceptable mais sans relief ni jargon professionnel.",
      "0.75":
        "Bon niveau de langue (B2/C1), vocabulaire sectoriel approprié, très rares erreurs de syntaxe.",
      "1": "Vocabulaire riche, précis et idiomatique. Utilisation aisée du jargon professionnel (vente, client, ONG).",
    },
  },
];
