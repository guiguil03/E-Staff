// Login générique (un seul endpoint /auth/login pour tous les rôles) —
// stopgap en attendant le vrai système de comptes (module 7 de la roadmap).
// Le rôle renvoyé par le backend est stocké ici et sert à la fois à savoir
// où rediriger après connexion et à protéger chaque tableau de bord.
export const ACCOUNT_ROLE_KEY = "estaf-account-role";
// Matricule conservé côté client (en plus du rôle) pour les appels backend
// qui identifient "mon" apprenant/formateur (classe virtuelle, planning) —
// jusqu'ici seul le rôle était gardé, le matricule n'était pas nécessaire.
export const ACCOUNT_MATRICULE_KEY = "estaf-account-matricule";

export const ROLE_ROUTES: Record<string, string> = {
  apprenant: "/compte/apprenant",
  formateur: "/compte/formateur",
};
