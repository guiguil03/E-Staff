import * as fs from "fs";
import * as path from "path";

// Charge backend/.env à la main (pas de dépendance dotenv côté frontend) —
// juste pour DATABASE_URL, seule variable dont ce helper a besoin.
function loadBackendDatabaseUrl(): string {
  const envPath = path.resolve(__dirname, "../../backend/.env");
  const content = fs.readFileSync(envPath, "utf8");
  const match = content.match(/^DATABASE_URL="?([^"\n]+)"?$/m);
  if (!match) throw new Error("DATABASE_URL introuvable dans backend/.env");
  return match[1];
}

process.env.DATABASE_URL ??= loadBackendDatabaseUrl();

// Le client généré vit dans backend/node_modules — les tests E2E (exécutés
// depuis la racine frontend) l'importent directement par chemin relatif
// plutôt que de dupliquer une installation Prisma côté frontend.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require(
  path.resolve(__dirname, "../../backend/node_modules/@prisma/client")
);

export const prisma = new PrismaClient();

// Garde-fou : ces tests écrivent dans une vraie base de données. Le nom
// d'hôte du proxy de dev (voir etaff-no-local-db-push) doit apparaître dans
// DATABASE_URL, sinon on refuse de démarrer — mieux vaut planter bruyamment
// que risquer d'écrire des données de test dans la production.
if (!process.env.DATABASE_URL?.includes("hopper.proxy.rlwy.net")) {
  throw new Error(
    "DATABASE_URL ne pointe pas vers la base de dev attendue (hopper.proxy.rlwy.net) — " +
      "arrêt par sécurité pour ne pas risquer d'écrire des données de test en production."
  );
}
