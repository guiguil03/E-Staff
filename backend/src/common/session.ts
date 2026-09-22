import * as jwt from "jsonwebtoken";
import type { Request, Response } from "express";

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
  return jwt.sign(payload, secret(), { expiresIn: SESSION_TTL_SECONDS });
}

export function readSession(request: Request): SessionPayload | null {
  const token = request.cookies?.[SESSION_COOKIE_NAME];
  if (!token || typeof token !== "string") return null;

  try {
    const decoded = jwt.verify(token, secret());
    if (typeof decoded !== "object" || !decoded) return null;
    const { matricule, role } = decoded as Partial<SessionPayload>;
    if (typeof matricule !== "string" || typeof role !== "string") return null;
    return { matricule, role: role as SessionRole };
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
