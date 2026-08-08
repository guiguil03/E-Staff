export interface SecteurFormation {
  slug: string;
  emoji: string;
  label: string;
  quote: string[];
  modules: string[];
  volumeHoraire: string;
}

// Les 3 secteurs "solutions directes sur vos sites" de la page Former son
// équipe — slug partagé avec le flow de rendez-vous (?secteur=) pour que le
// formulaire sache d'où vient la demande sans que l'entreprise ait à le
// retaper.
export const SECTEURS_FORMATION: SecteurFormation[] = [
  {
    slug: "francais-admin-b2b",
    emoji: "📑",
    label: "Français Admin & B2B",
    quote: [
      "Sublimez vos écrits et votre posture professionnelle. Nous travaillons directement sur vos vrais dossiers internes : e-mails, bilans et conduites de réunion.",
    ],
    modules: [
      "Écrits B2B & Correspondance (Clarté, ton juste & concision)",
      "Rapports, Synthèses & Présentation de Bilans",
      "Posture, Aisance Orale & Animation de Réunions",
    ],
    volumeHoraire: "24 Heures (sessions de 1h30 par roulement)",
  },
  {
    slug: "tourisme-hotellerie",
    emoji: "🍽️",
    label: "Tourisme, Hôtellerie & Restauration",
    quote: [
      "Offrez une expérience client irréprochable et élevez le niveau de service de vos équipes au standard VIP.",
      "Une immersion pratique basée sur vos propres supports (menus, procédures d'accueil, gestion des réclamations et codes de service).",
    ],
    modules: [
      "Module 1 : Accueil, Posture & Codes du Service VIP — aisance relationnelle, posture professionnelle, gestion des premiers contacts et vocabulaire d'excellence.",
      "Module 2 : Présentation de Menus, Carte & Recommandations — mise en valeur de vos produits, suggestion d'accords, explication claire des ingrédients et techniques de vente additionnelle.",
      "Module 3 : Gestion des Réclamations & Conduite de Réunion d'Équipe — désamorçage des situations délicates à chaud, animations de brief/debrief d'équipe et présentation de bilans opérationnels.",
    ],
    volumeHoraire:
      "24 heures (ex : 16 sessions de 1h30 par roulement pour ne jamais impacter le service)",
  },
  {
    slug: "centres-appels",
    emoji: "🎧",
    label: "Centres d'Appels & Relation Client",
    quote: [
      "Décrochez de meilleurs taux de résolution, fidélisez vos clients et perfectionnez la fluidité orale de vos téléconseillers.",
      "Un coaching immersif basé directement sur vos propres enregistrements d'appels, vos scripts et vos cas réels du quotidien.",
    ],
    modules: [
      "Module 1 : Écoute Active, Posture & Aisance Orale — sourire vocal, gestion du rythme, maîtrise des silences et posture professionnelle au téléphone.",
      "Module 2 : Traitement des Objections & Gestion des Conflits — désamorçage des situations tendues, gestion des clients difficiles, empathie et orientation solution à chaud.",
      "Module 3 : Conduite d'Entretien, Synthèse & Bilan d'Appel — déroulé rigoureux du script, structuration de la prise de note, argumentation claire et présentation de bilans d'écoute.",
    ],
    volumeHoraire:
      "24 heures (ex : 16 sessions de 1h30 par roulement pour préserver la planification des flux d'appels)",
  },
];
