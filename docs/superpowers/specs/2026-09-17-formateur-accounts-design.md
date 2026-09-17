# Vrais comptes formateur individuels

**Superseded 2026-09-17** : une PR distincte (#6, `feature-formateur-comptes-individuels`,
mergée sur `main` le 2026-09-16) avait déjà construit cette même fonctionnalité en
parallèle, en plus complet (scoping du Cockpit par `formateurId`, notifications,
régénération d'identifiants, assignation de groupes à la création) mais avec un
matricule saisi manuellement par la RH plutôt qu'auto-généré. Au moment de merger
`develop` avec `main`, les deux implémentations se sont télescopées (champs
dupliqués dans `schema.prisma`, méthodes qui s'écrasaient mutuellement) et ont
cassé le build. Résolution : abandon de l'auto-génération de matricule décrite
ci-dessous, adoption intégrale de la version de la PR #6 (déjà testée), en gardant
seulement le fix du conflit d'horaire (scoping par `groupe.formateurId`, commit
`b3b0a92`) qui n'existait pas dans cette PR. Le reste de ce document décrit le
design initial (non retenu) à titre d'historique.

Date : 2026-09-17
Contexte : la RH veut créer des comptes formateur individuels (au lieu de l'unique
login de test partagé `FORMATEUR_TEST_MATRICULE`). Mirroir exact du pattern déjà
en place pour `Apprenant` (matricule auto-généré + mot de passe temporaire envoyé
par e-mail à la création, voir `RhService.createApprenantAccount`).

## Décisions (validées avec le client)

- Mot de passe initial : généré automatiquement, haché, envoyé une seule fois en
  clair par e-mail (comme l'apprenant). Pas de saisie manuelle par la RH.
- Matricule : auto-généré, format `ETF-FORM-2026-XXXX` (cohérent avec le compte
  de test `ETF-FORM-2026-0001`). La RH ne le saisit plus.
- Le compte de test partagé (`FORMATEUR_TEST_MATRICULE` / `FORMATEUR_TEST_PASSWORD`)
  reste actif en parallèle des vrais comptes — pas de retrait.
- Premier compte réel créé : "Arijoana", email placeholder (pas de vrai email
  fourni) — donc pas d'envoi d'e-mail de bienvenue pour ce compte-là ; le
  matricule/mot de passe générés sont communiqués directement en dehors de l'e-mail.

## Composants

1. **Schéma Prisma (`Formateur`)** — ajoute `password String?`,
   `resetToken String? @unique`, `resetTokenExpiresAt DateTime?` (mêmes champs et
   mêmes contraintes que sur `Apprenant`). Migration.

2. **Création côté RH** — nouveau `CreateFormateurDto` (prenom/nom/email, pas de
   matricule). `RhService.createFormateur` :
   - génère le matricule suivant (`ETF-FORM-2026-XXXX`, même algorithme que
     `generateNextMatricule` pour l'apprenant, sur la table `Formateur`),
   - génère un mot de passe temporaire (réutilise `generateTemporaryPassword`,
     déjà présent dans `rh.service.ts`),
   - hash bcrypt, sauvegarde,
   - envoie l'e-mail de bienvenue (matricule + mot de passe en clair, une fois).
   `UpsertFormateurDto` (édition, `updateFormateur`) ne change pas — le matricule
   existant reste modifiable seulement à la création.
   `FormateursPanel.tsx` perd son champ "Matricule" dans le formulaire de création.

3. **Login réel** — `AuthService.loginFormateur(matricule, password)`, miroir de
   `loginApprenant`. Branché dans `AuthController.login` : ordre de résolution
   = comptes de test partagés (inchangé) → formateur réel → apprenant réel.

4. **Mot de passe oublié / changer / réinitialiser** — `AuthService.changePassword`,
   `forgotPassword`, `resetPassword` généralisés via un helper privé qui cherche
   d'abord dans `Apprenant`, puis dans `Formateur` par matricule. Aucune
   modification du DTO ni du frontend (`/mot-de-passe-oublie` et
   `ForgotPasswordForm.tsx` sont déjà génériques, juste "matricule").

5. **`FormateurGuard`** (`common/formateur.guard.ts`, module classe virtuelle) —
   devient async avec `PrismaService` injecté. Valide le header
   `x-formateur-matricule` si égal à `FORMATEUR_TEST_MATRICULE` OU s'il
   correspond à un `Formateur` existant en base.

## Hors scope (YAGNI)

- Pas de nouvelle page "Paramètres" côté Cockpit Formateur pour changer son mot
  de passe en self-service — pas demandé, pas de consommateur frontend
  aujourd'hui. Le endpoint backend généralisé (point 4) est prêt si/quand ce
  panneau est construit.
- Pas de retrait du compte de test partagé.

## Tests

- `rh.service.spec.ts` : `createFormateur` génère matricule + mot de passe,
  hash correct, e-mail envoyé avec le bon contenu.
- `auth.service.spec.ts` : `loginFormateur` valide/invalide ; `forgotPassword`/
  `resetPassword`/`changePassword` fonctionnent aussi pour un matricule formateur.
- `formateur.guard.spec.ts` (nouveau, ou étend `login-guards.spec.ts`) : matricule
  de test toujours accepté ; matricule réel en base accepté ; matricule inconnu
  rejeté.
