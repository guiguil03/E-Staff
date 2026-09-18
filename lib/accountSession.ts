// Login générique (un seul endpoint /auth/login pour tous les rôles) —
// stopgap en attendant le vrai système de comptes (module 7 de la roadmap).
// Le rôle renvoyé par le backend est stocké ici et sert à la fois à savoir
// où rediriger après connexion et à protéger chaque tableau de bord.
export const ACCOUNT_ROLE_KEY = "estaf-account-role";
// Matricule conservé côté client (en plus du rôle) pour les appels backend
// qui identifient "mon" apprenant/formateur (classe virtuelle, planning) —
// jusqu'ici seul le rôle était gardé, le matricule n'était pas nécessaire.
export const ACCOUNT_MATRICULE_KEY = "estaf-account-matricule";
// Posé uniquement quand la session vient d'un jeton "Se connecter en tant
// que" (RH -> apprenant, voir useRequireRole) — permet d'afficher un
// bandeau "vue admin" pour ne pas confondre cette session avec une vraie
// connexion apprenant.
export const ACCOUNT_VIEW_AS_ADMIN_KEY = "estaf-view-as-admin";

export const ROLE_ROUTES: Record<string, string> = {
  apprenant: "/compte/apprenant",
  formateur: "/compte/formateur",
  // Compte RH surchargé, ventilé en deux le 2026-09-18 : Admin garde la
  // génération de comptes/identifiants, les événements (réunions) et les
  // rentrées — sa page d'accueil est donc Académie, pas Vue d'ensemble
  // (qui reste la page d'accueil RH). RH récupère clients/contrats,
  // finances, pilotage. Même portail (/compte/admin/*) — chaque page/lien
  // de nav est filtré par rôle dans RhShell.
  admin: "/compte/admin/academie",
  rh: "/compte/admin",
};
