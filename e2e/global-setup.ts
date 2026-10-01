import net from "node:net";
import { execSync } from "node:child_process";
import { S3Client, CreateBucketCommand } from "@aws-sdk/client-s3";
import { E2E_DATABASE_URL } from "./db-config";
import {
  E2E_S3_ACCESS_KEY_ID,
  E2E_S3_BUCKET,
  E2E_S3_ENDPOINT_URL,
  E2E_S3_SECRET_ACCESS_KEY,
} from "./storage-config";

const POSTGRES_CONTAINER = "e-staf-e2e-db";
const MINIO_CONTAINER = "e-staf-e2e-s3";

function isReachable(host: string, port: number): Promise<boolean> {
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

async function waitReachable(host: string, port: number, seconds: number): Promise<boolean> {
  for (let i = 0; i < seconds; i++) {
    if (await isReachable(host, port)) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

// Démarre un conteneur Docker jetable pour `name` s'il n'écoute pas déjà sur
// host:port — en local comme en CI (les runners GitHub Actions ont Docker
// disponible nativement, voir .github/workflows/ci.yml : pas besoin d'un
// bloc `services:` séparé, ça évite en particulier les limites de ce
// mécanisme avec l'image MinIO, qui attend un argument de commande que
// `services:` ne sait pas passer proprement).
async function ensureContainer(params: {
  name: string;
  host: string;
  port: number;
  runArgs: string;
}) {
  const { name, host, port, runArgs } = params;
  if (await isReachable(host, port)) return;

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
}

export default async function globalSetup() {
  const dbUrl = new URL(E2E_DATABASE_URL);
  await ensureContainer({
    name: POSTGRES_CONTAINER,
    host: dbUrl.hostname,
    port: Number(dbUrl.port || 5432),
    runArgs:
      `-p ${dbUrl.port || 5432}:5432 -e POSTGRES_USER=${dbUrl.username} ` +
      `-e POSTGRES_PASSWORD=${dbUrl.password} -e POSTGRES_DB=${dbUrl.pathname.slice(1)} postgres:16`,
  });

  const s3Url = new URL(E2E_S3_ENDPOINT_URL);
  await ensureContainer({
    name: MINIO_CONTAINER,
    host: s3Url.hostname,
    port: Number(s3Url.port || 9000),
    runArgs:
      `-p ${s3Url.port || 9000}:9000 -e MINIO_ROOT_USER=${E2E_S3_ACCESS_KEY_ID} ` +
      `-e MINIO_ROOT_PASSWORD=${E2E_S3_SECRET_ACCESS_KEY} minio/minio server /data`,
  });

  // Un MinIO/service fraîchement démarré n'a aucun bucket — création
  // idempotente (ignore "déjà existant") plutôt que de dépendre d'une
  // option de démarrage spécifique à une image/version.
  const s3 = new S3Client({
    endpoint: E2E_S3_ENDPOINT_URL,
    region: "us-east-1",
    forcePathStyle: true,
    credentials: { accessKeyId: E2E_S3_ACCESS_KEY_ID, secretAccessKey: E2E_S3_SECRET_ACCESS_KEY },
  });
  try {
    await s3.send(new CreateBucketCommand({ Bucket: E2E_S3_BUCKET }));
  } catch (err) {
    const code = (err as { name?: string })?.name;
    if (code !== "BucketAlreadyOwnedByYou" && code !== "BucketAlreadyExists") throw err;
  }
}
