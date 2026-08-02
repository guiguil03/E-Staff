// The 8 user roles / account types defined in the cahier des charges (section 7.2).
// Order and wording follow the client's own list.
export interface AccountRole {
  id: string;
  label: string;
  description: string;
}

export const ACCOUNT_ROLES: AccountRole[] = [
  {
    id: "apprenant",
    label: "L'Apprenant",
    description: "Suivi de votre parcours de formation.",
  },
  {
    id: "agent",
    label: "L'Agent",
    description: "Missions et suivi de performance en poste.",
  },
  {
    id: "superviseur",
    label: "Le Superviseur",
    description:
      "Pilotage d'équipe, réservé aux comptes attribués par l'administration.",
  },
  {
    id: "formateur",
    label: "Le Formateur",
    description:
      "Gestion pédagogique, réservé aux comptes validés par la direction pédagogique.",
  },
  {
    id: "partenaire",
    label: "Le Partenaire",
    description: "Répertoire clients et suivi de commissions.",
  },
  {
    id: "entreprise",
    label: "L'Entreprise (Client)",
    description: "Suivi de vos collaborateurs mis à disposition.",
  },
  {
    id: "rh",
    label: "Le Compte RH",
    description: "Gestion des dossiers et attribution des matricules.",
  },
  {
    id: "direction",
    label: "Le Compte Direction",
    description: "Pilotage global.",
  },
];
