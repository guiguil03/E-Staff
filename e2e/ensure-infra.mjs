#!/usr/bin/env node
// Démarre (ou vérifie) Postgres + MinIO AVANT que `playwright test` ne soit
// même invoqué — voir pretest:e2e dans package.json.
//
// Historique du bug corrigé ici (2026-10-08) : cette logique vivait dans
// e2e/global-setup.ts (le hook `globalSetup` de Playwright). Mais dans
// l'ordre réel d'exécution de Playwright, les plugins `webServer` démarrent
// AVANT `globalSetup` (voir playwright/lib/runner/index.js,
// createGlobalSetupTasks : createPluginSetupTasks() est placé avant
// globalSetups.map(...)) — alors que le backend démarré par `webServer`
// (`prisma migrate deploy`) a besoin que Postgres tourne déjà. En local, le
// bug était invisible : les conteneurs Docker restent démarrés d'un run à
// l'autre (voir e2e:db:down pour les arrêter), donc Postgres était déjà
// disponible avant même que Playwright ne démarre. Sur un runner CI tout
// neuf, rien n'écoutait encore sur le port 5433 au moment où le backend
// essayait de s'y connecter → `prisma migrate deploy` plantait
// immédiatement (ECONNREFUSED) → tout le job E2E échouait, à chaque run.
//
// En appelant ce script en `pretest:e2e` (hook npm exécuté avant
// `test:e2e`, donc avant que Playwright ne démarre quoi que ce soit), les
// conteneurs sont garantis up avant que le premier webServer ne tente de se
// connecter — quel que soit l'environnement.
//
// Valeurs par défaut à garder synchronisées avec e2e/db-config.ts et
// e2e/storage-config.ts (dupliquées ici en JS brut : ce script tourne via
// `node`, pas via le chargeur TS de Playwright, pour pouvoir s'exécuter
// avant lui).
import net from "node:net";
import { execSync } from "node:child_process";
import { S3Client, CreateBucketCommand } from "@aws-sdk/client-s3";

const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5433/e_staf_e2e";
const E2E_S3_ENDPOINT_URL = process.env.E2E_S3_ENDPOINT_URL ?? "http://localhost:9000";
const E2E_S3_BUCKET = process.env.E2E_S3_BUCKET ?? "e-staf-e2e";
const E2E_S3_ACCESS_KEY_ID = process.env.E2E_S3_ACCESS_KEY_ID ?? "minioadmin";
const E2E_S3_SECRET_ACCESS_KEY = process.env.E2E_S3_SECRET_ACCESS_KEY ?? "minioadmin";

const POSTGRES_CONTAINER = "e-staf-e2e-db";
const MINIO_CONTAINER = "e-staf-e2e-s3";

function isReachable(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port, timeout: 1000 });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitReachable(host, port, seconds) {
  for (let i = 0; i < seconds; i++) {
    if (await isReachable(host, port)) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function ensureContainer({ name, host, port, runArgs }) {
  if (await isReachable(host, port)) {
    console.log(`[ensure-infra] ${name} déjà disponible sur ${host}:${port}.`);
    return;
  }

  try {
    execSync(`docker inspect ${name}`, { stdio: "ignore" });
    execSync(`docker start ${name}`, { stdio: "ignore" });
  } catch {
    try {
      execSync(`docker run -d --name ${name} ${runArgs}`, { stdio: "inherit" });
    } catch {
      throw new Error(
        `Impossible de démarrer ${name} (Docker indisponible et rien n'écoute sur ${host}:${port}). ` +
          `Démarrez vous-même le service sur cette URL, ou ajustez les variables E2E_* correspondantes.`
      );
    }
  }

  if (!(await waitReachable(host, port, 30))) {
    throw new Error(`${name} n'a pas démarré à temps (30s).`);
  }
  console.log(`[ensure-infra] ${name} prêt sur ${host}:${port}.`);
}

async function main() {
  const dbUrl = new URL(E2E_DATABASE_URL);
  await ensureContainer({
    name: POSTGRES_CONTAINER,
    host: dbUrl.hostname,
    port: Number(dbUrl.port || 5432),
    runArgs:
      `-p ${dbUrl.port || 5432}:5432 -e POSTGRES_USER=${dbUrl.username} ` +
      `-e POSTGRES_PASSWORD=${dbUrl.password} -e POSTGRES_DB=${dbUrl.pathname.slice(1)} postgres:16`,
  });

  // `minio/minio` (Docker Hub) : MinIO est passé en distribution
  // "source-only" et a retiré ses images publiques le 11-14/09/2026
  // (litige de licence/trademark) — l'API Docker Hub renvoie "object not
  // found" pour ce repo depuis. `quay.io/minio/minio`, l'alternative
  // recommandée partout, a lui aussi coupé les pulls anonymes fin
  // septembre 2026. `bitnamilegacy/minio` reste public à ce jour (mêmes
  // variables MINIO_ROOT_USER/MINIO_ROOT_PASSWORD, image figée donc stable,
  // pas de `server /data` à passer — son propre entrypoint démarre le
  // serveur) : solution de repli la plus fiable trouvée, mais non testée
  // ici (pas d'accès Docker dans ce sandbox) — si le prochain run CI échoue
  // encore sur ce conteneur, regarder `docker logs e-staf-e2e-s3`.
  const s3Url = new URL(E2E_S3_ENDPOINT_URL);
  await ensureContainer({
    name: MINIO_CONTAINER,
    host: s3Url.hostname,
    port: Number(s3Url.port || 9000),
    runArgs:
      `-p ${s3Url.port || 9000}:9000 -e MINIO_ROOT_USER=${E2E_S3_ACCESS_KEY_ID} ` +
      `-e MINIO_ROOT_PASSWORD=${E2E_S3_SECRET_ACCESS_KEY} bitnamilegacy/minio:latest`,
  });

  // Un MinIO fraîchement démarré n'a aucun bucket — création idempotente
  // (ignore "déjà existant") plutôt que de dépendre d'une option de
  // démarrage spécifique à une image/version.
  const s3 = new S3Client({
    endpoint: E2E_S3_ENDPOINT_URL,
    region: "us-east-1",
    forcePathStyle: true,
    credentials: { accessKeyId: E2E_S3_ACCESS_KEY_ID, secretAccessKey: E2E_S3_SECRET_ACCESS_KEY },
  });
  try {
    await s3.send(new CreateBucketCommand({ Bucket: E2E_S3_BUCKET }));
  } catch (err) {
    const code = err?.name;
    if (code !== "BucketAlreadyOwnedByYou" && code !== "BucketAlreadyExists") throw err;
  }
}

main().catch((err) => {
  console.error("[ensure-infra]", err);
  process.exit(1);
});
