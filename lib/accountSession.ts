// Login générique (un seul endpoint /auth/login pour tous les rôles) —
// stopgap en attendant le vrai système de comptes (module 7 de la roadmap).
// Le rôle renvoyé par le backend est stocké ici et sert à la fois à savoir
// où rediriger après connexion et à protéger chaque tableau de bord.
export const ACCOUNT_ROLE_KEY = "estaf-account-role";

export const ROLE_ROUTES: Record<string, string> = {
  apprenant: "/compte/apprenant",
  formateur: "/compte/formateur",
};
