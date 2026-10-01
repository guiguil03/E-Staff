import * as jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import { prismaEnregistre } from "./anti-abus";

// Remplace l'ancien stopgap "un header = une identité déclarée par le
// client" (voir git blame formateur.guard.ts / admin.guard.ts avant cette
// migration) : désormais la seule preuve d'identité acceptée est ce cookie,
// signé côté serveur à la connexion (AuthController.login /
// consumeViewAs) et vérifié à chaque requête par les guards de common/.
// Un client ne peut plus s'auto-attribuer un rôle ou un matricule en
// forgeant un header.
export type SessionRole = "admin" | "rh" | "formateur" | "apprenant";

export interface SessionPayload {
  matricule: string;
  role: SessionRole;
  /** Date d'émission (secondes, standard JWT). */
  iat?: number;
  /** Date d'émission en millisecondes — comparée à sessionsRevoqueesAt. */
  emis?: number;
}

export const SESSION_COOKIE_NAME = "estaf_session";
const SESSION_TTL_SECONDS = 12 * 60 * 60; // 12h — cohérent avec une session de travail.

function secret(): string {
  const value = process.env.JWT_SECRET;
  if (!value) {
    // Erreur explicite plutôt qu'un secret par défaut : un JWT_SECRET
    // manquant en prod rendrait toutes les sessions falsifiables si on
    // tombait silencieusement sur une valeur connue.
    throw new Error("JWT_SECRET n'est pas configuré.");
  }
  return value;
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign({ matricule: payload.matricule, role: payload.role, emis: Date.now() }, secret(), {
    expiresIn: SESSION_TTL_SECONDS,
  });
}

export function readSession(request: Request): SessionPayload | null {
  const token = request.cookies?.[SESSION_COOKIE_NAME];
  if (!token || typeof token !== "string") return null;

  try {
    const decoded = jwt.verify(token, secret());
    if (typeof decoded !== "object" || !decoded) return null;
    const { matricule, role, iat, emis } = decoded as Partial<SessionPayload>;
    if (typeof matricule !== "string" || typeof role !== "string") return null;
    return { matricule, role: role as SessionRole, iat, emis };
  } catch {
    return null;
  }
}

// secure/sameSite dépendent de l'environnement : front (Vercel) et backend
// (Railway) vivent sur des domaines différents en production, donc le
// cookie doit être cross-site (`SameSite=None` exige `Secure`). En local,
// les deux tournent en http sur des ports différents de la même machine —
// `Lax` suffit et évite d'exiger HTTPS en dev.
function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? "none" : "lax") as "none" | "lax",
    maxAge: SESSION_TTL_SECONDS * 1000,
    path: "/",
  };
}

export function setSessionCookie(response: Response, payload: SessionPayload): void {
  response.cookie(SESSION_COOKIE_NAME, signSession(payload), cookieOptions());
}

export function clearSessionCookie(response: Response): void {
  response.clearCookie(SESSION_COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
}

// ---- Vérification en base (audit du 2026-09-28) ------------------------------
//
// Un cookie signé ne suffit plus : le compte doit toujours exister, être
// actif, et la session doit avoir été émise après sa dernière révocation
// (« Déconnecter partout », changement ou réinitialisation du mot de passe).
// Utilisé par tous les guards. Sans connexion Prisma enregistrée (tests
// unitaires des guards), seule la signature est vérifiée.

function emiseApres(session: SessionPayload, revoqueesAt: Date | null | undefined): boolean {
  if (!revoqueesAt) return true;
  // Millisecondes (emis) ; les cookies antérieurs n'ont que iat (secondes).
  const emisMs = typeof session.emis === "number" ? session.emis : typeof session.iat === "number" ? session.iat * 1000 : null;
  return emisMs !== null && emisMs >= revoqueesAt.getTime();
}

// Identifiants partagés ADMIN_TEST_* / RH_TEST_* : acceptés seulement tant
// qu'aucun compte nominatif actif n'existe pour ce rôle (voir CompteStaff).
export function identifiantPartage(role: "admin" | "rh"): { matricule?: string; password?: string } {
  return role === "admin"
    ? { matricule: process.env.ADMIN_TEST_MATRICULE, password: process.env.ADMIN_TEST_PASSWORD }
    : { matricule: process.env.RH_TEST_MATRICULE, password: process.env.RH_TEST_PASSWORD };
}

export async function identifiantPartageAutorise(role: "admin" | "rh"): Promise<boolean> {
  const prisma = prismaEnregistre();
  if (!prisma) return true;
  const actifs = await prisma.compteStaff.count({ where: { role, actif: true } });
  return actifs === 0;
}

export async function sessionToujoursValide(session: SessionPayload): Promise<boolean> {
  const prisma = prismaEnregistre();
  if (!prisma) return true;
  const { matricule, role } = session;
  if (role === "formateur") {
    const f = await prisma.formateur.findUnique({ where: { matricule }, select: { sessionsRevoqueesAt: true } });
    return !!f && emiseApres(session, f.sessionsRevoqueesAt);
  }
  if (role === "apprenant") {
    const a = await prisma.apprenant.findUnique({ where: { matricule }, select: { sessionsRevoqueesAt: true } });
    return !!a && emiseApres(session, a.sessionsRevoqueesAt);
  }
  const compte = await prisma.compteStaff.findUnique({ where: { matricule } });
  if (compte) return compte.actif && compte.role === role && emiseApres(session, compte.sessionsRevoqueesAt);
  // Identifiant partagé (pas de ligne en base).
  return identifiantPartage(role).matricule === matricule && (await identifiantPartageAutorise(role));
}

export async function verifierSession(request: Request): Promise<SessionPayload | null> {
  const session = readSession(request);
  if (!session) return null;
  return (await sessionToujoursValide(session)) ? session : null;
}
