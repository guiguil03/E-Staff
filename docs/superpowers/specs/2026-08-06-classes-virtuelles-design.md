# Classes virtuelles & rappels — design

**Date**: 2026-08-06
**Statut**: validé par le client par sections, implémentation directe demandée (pas de revue intermédiaire).

## Contexte

"Classe virtuelle" est aujourd'hui un pur placeholder ("Bientôt disponible") côté Compte Apprenant (`components/compte-apprenant/QuickActions.tsx`) et Cockpit Formateur (`components/compte-formateur/TeachColumn.tsx`). Il n'existe aucune table Prisma pour les séances/groupes/apprenants/formateurs — tout le Cockpit Formateur et le Compte Apprenant tournent sur de la donnée de démo en dur (`components/compte-formateur/exampleData.ts`). Le login est un stopgap par variables d'environnement (un seul apprenant test, un seul formateur test), pas un vrai système de comptes.

Le client veut : (1) une vraie salle de classe virtuelle intégrée au site (pas juste un lien externe), et (2) des rappels automatiques par email avant chaque séance. Les deux impliquent de sortir du mode démo pour cette partie précise et de construire un vrai backend de planification.

## Décisions validées

- **Visio** : intégrée au site via iframe/SDK, pas un lien externe collé à la main.
- **Fournisseur visio** : Daily.co (widget prebuilt, création de salle via API REST simple, palier gratuit généreux).
- **Portée backend** : construire les vraies tables maintenant (pas de mode démo intermédiaire pour cette fonctionnalité).
- **Fournisseur email** : Resend, à configurer par le client plus tard (clé absente pour l'instant → comportement stub existant conservé).
- **Rappels** : 2 par séance — J-1 et 15 minutes avant le début.

## A. Modèle de données (Prisma)

Nouvelles tables dans `backend/prisma/schema.prisma` :

```prisma
model Groupe {
  id        String     @id @default(cuid())
  cle       String     @unique // "A".."F"
  label     String     // "Groupe A"
  apprenants Apprenant[]
  seances   Seance[]
}

model Formateur {
  id        String   @id @default(cuid())
  matricule String   @unique
  prenom    String
  nom       String
  email     String
}

model Apprenant {
  id        String   @id @default(cuid())
  matricule String   @unique
  prenom    String
  nom       String
  email     String
  groupeId  String
  groupe    Groupe   @relation(fields: [groupeId], references: [id])
}

model Seance {
  id                    String    @id @default(cuid())
  groupeId              String
  groupe                Groupe    @relation(fields: [groupeId], references: [id])
  numero                Int       // 1..12
  startAt               DateTime?
  dureeMinutes          Int       @default(90)
  objectifs             String?
  dailyRoomUrl          String?
  dailyRoomName         String?
  rappelJ1EnvoyeAt      DateTime?
  rappel15minEnvoyeAt   DateTime?

  @@unique([groupeId, numero])
}
```

Seed de démo : un `Formateur` (matricule = `FORMATEUR_TEST_MATRICULE`), un `Groupe` "A", quelques `Apprenant` dont un avec le matricule `APPRENANT_TEST_MATRICULE` — reprend le pattern déjà utilisé pour les comptes de test (`.env.example`).

La grille des 5 compétences (Expression Orale/Écrite, Posture & Éloquence, Compréhension O/E) reste dans le store frontend local (`planningGradesStore.ts`) construit précédemment — sujet distinct de la planification d'horaire, pas de changement là-dessus.

## B. Intégration Daily.co

- `backend/src/classe-virtuelle/daily.service.ts` : `createRoom(seanceId)` appelle `POST https://api.daily.co/v1/rooms` (auth `Authorization: Bearer ${DAILY_API_KEY}`), room name dérivé de `seanceId`, `properties.exp` réglé sur `startAt + dureeMinutes + 15min` de marge. Si `DAILY_API_KEY` absente, retourne `{ configured: false }` sans appeler l'API — même logique que `EmailService`/`CalendarEmbed.isCalendarConfigured()`.
- La salle est créée automatiquement dès que le formateur (re)planifie `startAt` sur une séance (pas d'action "lancer" séparée à l'avance).
- Fenêtre de rejoin (back + front) : `startAt - 10min` → `startAt + dureeMinutes`. En dehors de cette fenêtre, le lien reste désactivé.
- Nouvelles pages :
  - `app/compte/apprenant/classe-virtuelle/[seanceId]/page.tsx`
  - `app/compte/formateur/classe-virtuelle/[seanceId]/page.tsx`

  Chacune vérifie la fenêtre de rejoin côté serveur (l'API refuse de renvoyer l'URL Daily hors fenêtre) puis embarque l'iframe Daily prebuilt en plein écran, avec un lien retour.

## C. Rappels par email

- `@nestjs/schedule` (`ScheduleModule.forRoot()`), cron `@Cron('*/5 * * * *')` dans `ClasseVirtuelleReminderService` :
  - Séances où `startAt` tombe dans `[now+24h, now+24h+5min]` et `rappelJ1EnvoyeAt` est `null` → email à chaque `Apprenant` du `Groupe`, puis `rappelJ1EnvoyeAt = now()`.
  - Même logique pour `[now+15min, now+20min]` → `rappel15minEnvoyeAt`.
- Contenu email (`EmailService.send`) : prénom de l'apprenant, date/heure de la séance, objectifs, lien vers `/compte/apprenant/classe-virtuelle/[seanceId]` (pas le lien Daily brut — on garde le contrôle de la fenêtre de rejoin côté site).
- Tant que `EMAIL_PROVIDER_API_KEY` n'est pas configurée, `EmailService` continue de logguer en console (comportement déjà existant, aucun changement de code nécessaire côté client une fois la clé fournie).

## D. Câblage frontend

- **Planning par Groupe** (`PlanningDashboard.tsx`) : ajout d'un champ date/heure par séance sélectionnée, lu/écrit via une vraie API backend (`GET/PUT /seances`) au lieu de rester en state local. La sauvegarde déclenche la création de salle Daily côté serveur si `startAt` est renseigné pour la première fois.
- **QuickActions** (apprenant) : "Rejoindre la salle de classe virtuelle" devient un vrai lien conditionnel (actif seulement dans la fenêtre de rejoin de la prochaine séance de son groupe), sinon reste désactivé comme aujourd'hui.
- **TeachColumn** (formateur) : "Lancer la Classe Virtuelle" même traitement, vers la page formateur.
- **Auth des nouvelles routes** : réutilise le pattern `TrainerGuard` déjà en place pour l'espace formateur (code partagé en header) — pas de nouveau système d'auth introduit, cohérent avec le stopgap actuel en attendant le vrai système de comptes (module 7 de la roadmap).

## Hors périmètre (explicitement)

- Vrai système de comptes/JWT (module 7 de la roadmap) — les routes réutilisent le stopgap `TrainerGuard`/matricule existant.
- SMS ou notifications push — email uniquement pour cette itération.
- Enregistrement vidéo, chat en salle, partage d'écran avancé — capacités par défaut de Daily prebuilt, rien de custom.
- Auto-création d'un email réel avant que le client configure `RESEND_API_KEY`/`EMAIL_PROVIDER_API_KEY` — le stub-log reste le comportement par défaut.
