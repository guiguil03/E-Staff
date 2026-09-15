// Type partagé par ProfileHeader/CompetencyBars — les données affichées
// viennent désormais du vrai backend (voir NotationService.getApprenantDashboard),
// ce fichier ne garde que la forme commune.

export interface CompetencyScore {
  key: string;
  label: string;
  score: number; // /20
}
