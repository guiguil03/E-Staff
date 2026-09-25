// Débloque au démarrage (avant `prisma migrate deploy`, voir start:prod) une
// migration connue restée en échec dans la base de production. Sans ça,
// Prisma refuse d'appliquer toute migration suivante (erreur P3009) : le
// nouveau déploiement ne démarre pas et Railway garde l'ancienne version en
// ligne — aucune des évolutions postérieures n'arrive en production.
//
// Cas traité : 20260916120000_add_formateur_compte_individuel, en échec en
// production depuis le 2026-09-17 — très probablement parce que les
// colonnes existaient déjà (ajoutées hors migration), l'ALTER TABLE
// échouant alors sur « column already exists ». On rejoue la migration en
// version idempotente (IF NOT EXISTS : sans effet si déjà en place,
// complète sinon), puis on la marque appliquée. Aucune donnée n'est
// modifiée ni supprimée. Réparation validée par le client le 2026-09-25.
//
// Sans effet si la table _prisma_migrations n'existe pas encore ou si
// aucune migration de REPAIRS n'est en échec : sans risque à chaque
// démarrage. Une migration en échec absente de REPAIRS est seulement
// signalée — `prisma migrate deploy` s'arrêtera alors avec P3009, comme
// avant.
const { execFileSync } = require("child_process");
const { PrismaClient } = require("@prisma/client");

const REPAIRS = {
  "20260916120000_add_formateur_compte_individuel": [
    `ALTER TABLE "Formateur" ADD COLUMN IF NOT EXISTS "password" TEXT`,
    `ALTER TABLE "Formateur" ADD COLUMN IF NOT EXISTS "resetToken" TEXT`,
    `ALTER TABLE "Formateur" ADD COLUMN IF NOT EXISTS "resetTokenExpiresAt" TIMESTAMP(3)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Formateur_resetToken_key" ON "Formateur"("resetToken")`,
  ],
};

async function main() {
  const prisma = new PrismaClient();
  try {
    let failed;
    try {
      failed = await prisma.$queryRawUnsafe(
        `SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NULL AND rolled_back_at IS NULL`
      );
    } catch {
      // Base vierge : pas encore de table _prisma_migrations.
      return;
    }

    for (const { migration_name: name } of failed) {
      const statements = REPAIRS[name];
      if (!statements) {
        console.warn(`[migrations] Migration en échec sans réparation connue : ${name}`);
        continue;
      }
      console.log(`[migrations] Réparation de la migration en échec ${name}...`);
      for (const sql of statements) {
        await prisma.$executeRawUnsafe(sql);
      }
      // CLI Prisma du projet (même version que le client), sans passer par npx.
      execFileSync(
        process.execPath,
        [require.resolve("prisma/build/index.js"), "migrate", "resolve", "--applied", name],
        { stdio: "inherit" }
      );
      console.log(`[migrations] ${name} marquée comme appliquée.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("[migrations] Échec de la réparation :", err);
  process.exit(1);
});
