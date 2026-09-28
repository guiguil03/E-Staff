import type { PrismaClient } from "@prisma/client";

// Compteurs anti-abus (limites de requêtes, verrouillage après échecs de
// connexion) — en base, table CompteurAbus (audit du 2026-09-28) : partagés
// entre plusieurs instances Railway et conservés après un redémarrage.
//
// La connexion Prisma est enregistrée au démarrage par PrismaService
// (enregistrerPrismaAntiAbus). Sans elle — tests unitaires des guards —
// on retombe sur des compteurs en mémoire, même comportement.

let prisma: PrismaClient | null = null;

export function enregistrerPrismaAntiAbus(client: PrismaClient | null): void {
  prisma = client;
}

export function prismaEnregistre(): PrismaClient | null {
  return prisma;
}

interface Entree {
  compte: number;
  debutFenetre: number;
  verrouilleJusqua: number | null;
}
const memoire = new Map<string, Entree>();

// ---- Limite de requêtes par fenêtre (RateLimitGuard) ------------------------

// Incrémente le compteur de la clé et renvoie sa valeur dans la fenêtre
// courante (une fenêtre expirée repart à 1).
export async function compterRequete(cle: string, fenetreMs: number): Promise<number> {
  if (!prisma) {
    const now = Date.now();
    const e = memoire.get(cle);
    if (!e || now - e.debutFenetre >= fenetreMs) {
      memoire.set(cle, { compte: 1, debutFenetre: now, verrouilleJusqua: null });
      return 1;
    }
    e.compte += 1;
    return e.compte;
  }
  // Une seule requête atomique : correcte même avec plusieurs instances.
  const rows = await prisma.$queryRaw<{ compte: number }[]>`
    INSERT INTO "CompteurAbus" ("cle", "compte", "debutFenetre")
    VALUES (${cle}, 1, now())
    ON CONFLICT ("cle") DO UPDATE SET
      "compte" = CASE WHEN "CompteurAbus"."debutFenetre" < now() - (${fenetreMs} * interval '1 millisecond')
                      THEN 1 ELSE "CompteurAbus"."compte" + 1 END,
      "debutFenetre" = CASE WHEN "CompteurAbus"."debutFenetre" < now() - (${fenetreMs} * interval '1 millisecond')
                            THEN now() ELSE "CompteurAbus"."debutFenetre" END
    RETURNING "compte"`;
  return Number(rows[0]?.compte ?? 1);
}

// ---- Verrouillage après échecs (connexion, guards) -------------------------

export const MAX_ECHECS = 5;
export const VERROU_MS = 15 * 60 * 1000;

export async function secondesVerrouRestantes(cle: string): Promise<number> {
  let jusqua: number | null = null;
  if (!prisma) {
    jusqua = memoire.get(cle)?.verrouilleJusqua ?? null;
  } else {
    const row = await prisma.compteurAbus.findUnique({ where: { cle } });
    jusqua = row?.verrouilleJusqua?.getTime() ?? null;
  }
  if (!jusqua) return 0;
  const restant = jusqua - Date.now();
  return restant > 0 ? Math.ceil(restant / 1000) : 0;
}

export async function enregistrerEchec(cle: string): Promise<void> {
  if (!prisma) {
    const e = memoire.get(cle) ?? { compte: 0, debutFenetre: Date.now(), verrouilleJusqua: null };
    e.compte += 1;
    if (e.compte >= MAX_ECHECS) {
      e.verrouilleJusqua = Date.now() + VERROU_MS;
      e.compte = 0;
    }
    memoire.set(cle, e);
    return;
  }
  await prisma.$executeRaw`
    INSERT INTO "CompteurAbus" ("cle", "compte", "debutFenetre")
    VALUES (${cle}, 1, now())
    ON CONFLICT ("cle") DO UPDATE SET
      "compte" = CASE WHEN "CompteurAbus"."compte" + 1 >= ${MAX_ECHECS} THEN 0 ELSE "CompteurAbus"."compte" + 1 END,
      "verrouilleJusqua" = CASE WHEN "CompteurAbus"."compte" + 1 >= ${MAX_ECHECS}
                                THEN now() + (${VERROU_MS} * interval '1 millisecond')
                                ELSE "CompteurAbus"."verrouilleJusqua" END`;
}

export async function effacerEchecs(cle: string): Promise<void> {
  if (!prisma) {
    memoire.delete(cle);
    return;
  }
  await prisma.compteurAbus.deleteMany({ where: { cle } });
}

// Ménage (cron horaire, voir AntiAbusCronService) : fenêtres de plus d'une
// heure sans verrou actif.
export async function purgerCompteursExpires(): Promise<number> {
  const limite = new Date(Date.now() - 60 * 60 * 1000);
  if (!prisma) {
    let n = 0;
    for (const [k, e] of memoire) {
      if (e.debutFenetre < limite.getTime() && (!e.verrouilleJusqua || e.verrouilleJusqua < Date.now())) {
        memoire.delete(k);
        n++;
      }
    }
    return n;
  }
  const { count } = await prisma.compteurAbus.deleteMany({
    where: {
      debutFenetre: { lt: limite },
      OR: [{ verrouilleJusqua: null }, { verrouilleJusqua: { lt: new Date() } }],
    },
  });
  return count;
}
