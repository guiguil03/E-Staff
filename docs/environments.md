# Environnements : dev vs prod

Objectif : `develop` déploie sur un environnement de test (Vercel preview +
backend Railway "staging" + base de test), `main` déploie sur le `.com`
officiel + backend Railway "production" + base réelle. Les deux environnements
ne doivent jamais partager de base de données ni de secrets.

## Ce qui est déjà automatisé (`.github/workflows/ci.yml`)

- Push/merge sur `main` → job `deploy-vercel` (prod, domaine `.com`).
- Push/merge sur `develop` → job `deploy-vercel-dev` (preview, alias stable
  `e-staff-dev.vercel.app`).
- Les deux jobs ne se déclenchent que si le job `frontend` (build + tests)
  est vert.
- Le backend n'est **pas** déployé par ce workflow : Railway redéploie tout
  seul sur push, à condition que chaque service Railway soit lié à la bonne
  branche (à faire une fois, voir plus bas).

## Ce qu'il reste à faire à la main (accès dashboard requis)

Ces étapes touchent à de la facturation et à des comptes externes (Vercel,
Railway) — impossible à automatiser depuis ce repo sans tes identifiants.
Compte environ 20-30 min, à faire une seule fois.

### 1. Railway — créer le service "staging"

1. Dans le projet Railway existant, dupliquer l'environnement de prod :
   `Project Settings > Environments > + New Environment`, nommer `staging`,
   partir d'un clone de `production` (Railway propose "Duplicate environment"
   — ça copie la structure des services mais pas les données).
2. Sur le service backend de cet environnement `staging` :
   - `Settings > Source` → brancher sur la branche `develop` (au lieu de
     `main`).
   - `Settings > Deploy Triggers` → laisser l'auto-deploy actif sur
     `develop` uniquement.
3. Provisionner une base Postgres dédiée dans cet environnement (`+ New >
   Database > PostgreSQL`) — **ne pas réutiliser la base de prod**. Railway
   génère automatiquement `DATABASE_URL`.
4. Copier les variables d'env du service prod vers le service staging
   (`backend/.env.example` liste tout ce qui est attendu), en changeant :
   - `DATABASE_URL` → celle de la nouvelle base staging (auto).
   - `CORS_ORIGIN` → `https://e-staff-dev.vercel.app`
   - `FRONTEND_URL` → `https://e-staff-dev.vercel.app`
   - `BACKEND_PUBLIC_URL` → l'URL publique générée par Railway pour ce
     service staging.
   - `JWT_SECRET` → **une valeur différente** de la prod (générer avec
     `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
   - `DAILY_API_KEY`, `AWS_*` (bucket), `PAPI_API_KEY` → utiliser les
     identifiants de test/sandbox de ces services si disponibles, sinon
     laisser vide (le code gère déjà l'absence, cf. commit
     `d840fe1`).
   - `APPRENANT_TEST_MATRICULE` / mots de passe de test → peuvent rester
     identiques, ce sont déjà des comptes de démo.
5. Une fois déployé, exécuter les migrations Prisma sur la nouvelle base :
   `start:prod` le fait automatiquement (`prisma migrate deploy && node
   dist/main`), donc rien à faire à la main après le premier déploiement.
6. Noter l'URL publique générée (ex. `backend-staging-xxxx.up.railway.app`)
   et la reporter dans `.env.example` (déjà pré-rempli avec un placeholder)
   et dans la variable Vercel de l'étape suivante.

### 2. Vercel — variables d'environnement "Preview"

1. `Project Settings > Environment Variables`.
2. Ajouter `NEXT_PUBLIC_API_URL` scopée sur **Preview** uniquement (pas
   Production) avec la valeur de l'URL Railway staging notée ci-dessus.
3. Vérifier que `NEXT_PUBLIC_API_URL` en scope **Production** pointe bien
   vers `https://backend-production-547d8.up.railway.app`.
4. `NEXT_PUBLIC_CAL_LINK_*` peuvent rester identiques dans les deux scopes
   (pas de dépendance à un backend).
5. Vérifier que l'auto-deploy Git est bien désactivé (`Project Settings >
   Git`) — le déploiement passe uniquement par le workflow CI (cf. commentaire
   en tête de `ci.yml`).
6. Le premier run du job `deploy-vercel-dev` créera l'alias
   `e-staff-dev.vercel.app` automatiquement (`vercel alias set`). Si ce nom
   est déjà pris, changer la valeur dans `ci.yml` (job `deploy-vercel-dev`,
   dernière étape) et dans ce doc.

### 3. Domaine `.com`

Le domaine officiel reste attaché uniquement à l'environnement **Production**
de Vercel (`Project Settings > Domains`) — ne pas l'attacher à Preview. Rien
à changer ici si c'est déjà le cas.

## Résumé des paires environnement / config

| | Prod | Dev/staging |
|---|---|---|
| Frontend | domaine `.com` (Vercel Production) | `e-staff-dev.vercel.app` (Vercel Preview) |
| Backend | `backend-production-547d8.up.railway.app` | `backend-staging-xxxx.up.railway.app` |
| Base de données | Postgres prod (Railway) | Postgres staging (Railway, isolée) |
| Branche | `main` | `develop` |
| Secrets (JWT_SECRET, etc.) | prod | dédiés, différents de la prod |

## Garde-fous

- Ne jamais faire pointer `DATABASE_URL` de staging vers la base de prod,
  même temporairement pour "tester avec des vraies données" — copier un dump
  anonymisé si besoin de données réalistes.
- `JWT_SECRET` doit différer entre les deux environnements (sinon un cookie
  de session dev serait valide en prod et inversement).
- Les workflows email (`FRONTEND_URL`) et Daily.co (`BACKEND_PUBLIC_URL`)
  utilisent ces variables pour générer des liens : une mauvaise valeur en
  staging enverrait des liens de test vers le domaine de prod (ou
  inversement).
