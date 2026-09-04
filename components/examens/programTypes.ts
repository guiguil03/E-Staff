// Les 6 programmes du funnel Examens — mêmes valeurs que les `segment` déjà
// utilisés par chaque DiplomaCard (voir app/offres/examens/page.tsx), pour
// rester cohérent. Utilisé pour le menu déroulant "Type de formation"
// obligatoire du formulaire d'inscription : le candidat peut confirmer ou
// changer le programme visé indépendamment de la carte depuis laquelle il a
// ouvert la modale.
export interface ProgramTypeOption {
  value: string;
  label: string;
}

export const PROGRAM_TYPE_OPTIONS: ProgramTypeOption[] = [
  { value: "delf-dalf", label: "DELF / DALF" },
  { value: "tef-canada", label: "TEF Canada / TCF" },
  { value: "dfp-affaires", label: "DFP Affaires" },
  { value: "dfp-ri", label: "DFP Relations Internationales" },
  { value: "dfp-tourisme", label: "DFP Tourisme, Hôtellerie & Restauration" },
  { value: "dfp-sante", label: "DFP Santé" },
];
