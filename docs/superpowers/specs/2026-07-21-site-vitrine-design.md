# Site vitrine — Académie de langues & Production B2B (Madagascar) — Phase 1

Date : 2026-07-21
Statut : approuvé par l'utilisateur, prêt pour planification d'implémentation.

## 1. Contexte produit

Structure basée à Madagascar avec deux moteurs de revenus :
- **Académie** : préparation aux examens internationaux, programme **FOL** (Français Oratoire des Leaders) pour professionnels.
- **Production B2B** : mise à disposition d'agents formés pour centres d'appels / clients internationaux.

Le site vitrine ne vend rien directement. Ses deux objectifs :
1. Donner envie à un candidat malgache de postuler.
2. Rassurer un client/apporteur d'affaires qui découvre la structure.

Ton : équipe malgache qui parle à de vrais gens, jamais un cabinet de conseil parisien. Phrases actives, courtes, concrètes ("17 jours de formation intensive, 5 métiers accessibles derrière"), jamais de formules creuses ("Rejoignez l'aventure", "Excellence sur mesure"). Boutons = actions exactes ("Déposer mon CV", "Lire l'article", "Voir le programme FOL"), jamais "Découvrir" seul.

**Hors scope Phase 1** (mais code extensible pour plus tard) : back-office recrutement/filtrage automatique, dashboards superviseurs, module compta/RH, envoi d'e-mails transactionnels, upload/traitement de CV ou vidéos de candidats.

## 2. Contrainte transversale : confidentialité des identités

Partout côté public (hero, auteurs d'articles, commentateurs, témoignages) : **prénom uniquement**, jamais de nom de famille visible ni stocké dans un champ public.

Appliqué structurellement : le type TypeScript partagé pour une "personne publique" n'a qu'un champ `firstname` (pas de `lastname` optionnel qu'on oublierait de cacher). Toute donnée interne (ex. contact) peut avoir un nom complet côté DB/admin, mais ce champ ne doit jamais transiter vers un composant public.

## 3. Identité visuelle

### Palette (thème Tailwind remplacé, pas étendu — aucune couleur Tailwind par défaut dans le code final)

| Rôle | Hex |
|---|---|
| Fond (`background`) | `#F3F5F1` |
| Encre (`ink`) | `#1A1D1B` |
| Primaire (`primary`) | `#1B3A4B` |
| Accent (`accent`) | `#D99A2B` |
| Succès (`success`) | `#2F6B4F` |
| Neutre support (`muted`) | `#8C8579` |

### Typographie (via `next/font`, self-hosted — pas de requête Google Fonts au runtime, important pour la connexion Madagascar)
- Display/titres : **Fraunces** — jamais en dessous de 32px, jamais pour du texte courant.
- Texte courant : **IBM Plex Sans**.
- Chiffres/labels/data (niveaux de langue, dates, stats) : **IBM Plex Mono**.

### Signature visuelle : `LanguageRibbon`
Ruban SVG représentant le parcours A1 → B1 → B2 → C1. Composant unique, deux variantes :
- `animated` : dessiné une fois au chargement de la home via `stroke-dasharray`/`stroke-dashoffset` sur un seul `<path>` — pas de librairie d'animation lourde, pas de re-déclenchement au scroll.
- `static` : utilisé en footer et en header de la page carrières.

Le niveau atteint peut être surligné en `success` (ex. témoignage "a atteint le niveau B2").

### Règles de layout
- Mobile-first strict.
- Radius 6–8px partout (`borderRadius.DEFAULT: 7px`) — ni coins carrés systématiques, ni pilules SaaS.
- Hero : photo + prénom d'un profil réel (agent/élève), citation courte, résultat concret — jamais d'illustration abstraite ni de gradient centré générique.
- Une seule séquence de motion orchestrée par page (le ruban au chargement de la home) — **aucun fade-in générique au scroll**.

### À éviter explicitement (voir brief section 2 pour la liste complète)
Fond crème + serif géant + terracotta, fond noir + accent fluo unique, mise en page "journal" à filets fins, icônes génériques en grille 3 colonnes pastel, sections "01/02/03" arbitraires, illustrations flat design façon Notion, animations fade-in gratuites.

## 4. Stack technique

- **Next.js 14 (App Router) + TypeScript**. Choix motivé par la portabilité : l'hébergement final (Vercel vs Cloudflare Pages/Workers) n'est pas encore tranché, donc pas de dépendance à une plateforme précise dans `next.config.js`.
- **Tailwind CSS**, thème custom (section 3).
- **Contenu éditorial (articles)** : fichiers MDX dans `content/articles/*.mdx`, parsés via `gray-matter` + `next-mdx-remote`. Pas de CMS externe en Phase 1.
- **Commentaires + messages de contact** : **Postgres serverless (Neon)** + **Prisma**. SQLite fichier écarté car incompatible avec un hébergement serverless (le fichier ne survit pas aux redéploiements) ; Neon fonctionne aussi bien sur Vercel que sur Cloudflare, ce qui préserve le choix d'hébergement.
- **Admin** (`/admin`) : mot de passe unique via `ADMIN_PASSWORD` (hashé bcrypt), cookie de session signé `httpOnly`/`secure`, expiration ~8h. Pas de multi-compte, pas de rôles.

### Alternatives écartées
- SQLite local : incompatible serverless.
- CMS headless (Sanity/Contentful) : trop lourd pour la Phase 1, le brief l'exclut explicitement.
- Service tiers de commentaires (Disqus etc.) : casserait la contrainte prénom-uniquement / pas de fil de discussion, ces services exposent des profils publics complets.

## 5. Routing & pages

```
/                        Accueil
/publications             Liste des articles
/publications/[slug]      Article + commentaires
/offres/examens           Préparation aux examens internationaux
/offres/fol               Programme FOL
/offres/carrieres         "Vous cherchez du travail ?" (CTA seul, pas de back-office)
/a-propos
/contact
/mentions-legales          Champs [à compléter] pour raison sociale/NIF/adresse
/confidentialite           Politique de confidentialité (gestion CV/vidéos candidats)
/admin                     Modération commentaires + messages contact (protégé)
```

### Page d'accueil — sections (brief 4.1)
1. Hero : profil réel (prénom seul), citation courte, résultat concret.
2. "Ce qu'on fait" : Académie + Production B2B, langage simple.
3. Publications récentes (3 dernières).
4. Offres phares (3 cartes vers `/offres/*`), CTA explicites.
5. Footer : mentions légales, contact, réseaux, `LanguageRibbon` statique.

## 6. Modèle de contenu

### Frontmatter article MDX
```yaml
title: string
slug: string
excerpt: string
author_firstname: string   # jamais de nom de famille
published_at: date
category: "réussite" | "conseils langue" | "actus académie"
cover_image: string
```

### Schéma Prisma
```prisma
model Comment {
  id          String   @id @default(cuid())
  articleSlug String
  firstName   String
  body        String
  status      String   @default("pending") // pending | approved | rejected
  createdAt   DateTime @default(now())
}

model ContactMessage {
  id        String   @id @default(cuid())
  firstName String
  email     String
  subject   String
  body      String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```
Pas de table `AdminSession` — session stateless via JWT signé en cookie.

## 7. Commentaires — flux

1. Visiteur soumet prénom + texte sous un article → `POST /api/comments` → statut `pending`.
2. Rien ne s'affiche publiquement avant approbation.
3. `/admin` liste les commentaires `pending` → Approuver/Rejeter → `PATCH /api/admin/comments/:id`.
4. `GET /api/comments?articleSlug=...` ne renvoie que les `approved`, triés par date.
5. **Structure plate uniquement** : un commentaire = un objet indépendant. Pas de réponses imbriquées, pas de mentions, pas de fil de discussion visiteur↔visiteur.

## 8. Contact

- Formulaire (prénom, email, sujet, message) → `POST /api/contact` → stocké en DB, consultable dans `/admin`.
- **Pas d'envoi d'email automatique en Phase 1** (pas de SMTP configuré) — l'admin consulte la liste dans `/admin`. Point explicitement signalé pour ne pas surprendre plus tard.

## 9. Résilience connexion faible (brief section 6)

- Formulaires de commentaire et de contact sauvegardent leur brouillon dans `localStorage` (debounced à chaque frappe), restauré si la page recharge avant envoi, vidé après soumission réussie.
- Pas de librairie de formulaires (react-hook-form serait overkill vu la taille des formulaires) — validation client minimale en state React natif.
- Images compressées, pas de JS lourd inutile.

## 10. Contenu de lancement

Contenu d'exemple réaliste à écrire (ton section du brief respecté), à remplacer par du contenu réel ensuite :
- Textes des pages statiques (accueil, à propos, contact, 3 pages offres).
- ~3-4 articles de blog d'exemple (réussite d'agent, conseil langue, actu académie).
- Photos : placeholders visuels neutres (pas de vraies photos disponibles à ce stade).
- Mentions légales / confidentialité : champs `[à compléter]` pour raison sociale, NIF/Stat, adresse, forme juridique — l'utilisateur les complétera plus tard.

## 11. Definition of done (reprise du brief, section 7)

- [ ] Palette et typographie appliquées de bout en bout, aucune couleur Tailwind par défaut résiduelle.
- [ ] Accueil, publications + article + commentaires (sans fil inter-utilisateurs), 3 pages offres, page carrières (CTA seul), à propos, contact, mentions légales, confidentialité, admin.
- [ ] Prénom uniquement affiché partout côté public.
- [ ] Responsive mobile testé en priorité.
- [ ] Aucune animation fade-in générique au scroll ; uniquement le `LanguageRibbon`, utilisé avec parcimonie.
- [ ] Textes réécrits selon le ton du brief, pas de copy placeholder générique.
- [ ] Formulaires (commentaire, contact) sauvegardent un brouillon local et le restaurent après rechargement.
- [ ] `/admin` permet d'approuver/rejeter les commentaires et de consulter les messages de contact, protégé par mot de passe.
