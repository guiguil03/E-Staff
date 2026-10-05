import { UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { recordFailure, remainingLockoutSeconds } from "./login-rate-limit";
import { SessionPayload, SessionRole, readSessions, sessionToujoursValide } from "./session";

// Logique commune des guards de rôle (audit du 2026-09-28) :
// - la session doit être signée ET toujours valide en base (compte actif,
//   non révoquée, voir verifierSession) ;
// - une session valide passe toujours, sans toucher aux compteurs ;
// - les échecs sont comptés par IP (5 → verrou de 15 min, en base).
export async function exigerSession(
  request: Request,
  options: {
    cle: string;
    roles: SessionRole[];
    message: string;
    accepte?: (session: SessionPayload) => boolean;
  }
): Promise<SessionPayload> {
  for (const session of readSessions(request)) {
    if (!options.roles.includes(session.role) || !(options.accepte?.(session) ?? true)) continue;
    if (await sessionToujoursValide(session)) return session;
  }

  const key = `${options.cle}:${request.ip}`;
  const lockedFor = await remainingLockoutSeconds(key);
  if (lockedFor > 0) {
    throw new UnauthorizedException(`Trop de tentatives. Réessayez dans ${lockedFor}s.`);
  }
  await recordFailure(key);
  throw new UnauthorizedException(options.message);
}
