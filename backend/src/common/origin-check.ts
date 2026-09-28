import type { NextFunction, Request, Response } from "express";

// Protection CSRF (audit du 2026-09-28). Le cookie de session est
// `SameSite=None` en production (front Vercel et API Railway sur des
// domaines différents, voir session.ts) : le navigateur le joint donc aussi
// aux requêtes lancées depuis un site tiers. CORS empêche ce site de LIRE
// la réponse, mais pas d'ENVOYER un formulaire (POST urlencoded/multipart)
// qui modifierait des données au nom de la personne connectée.
//
// Les navigateurs ajoutent toujours l'en-tête Origin aux requêtes
// cross-origin qui modifient des données : on refuse celles dont l'origine
// n'est pas le front autorisé (CORS_ORIGIN). Les appels serveur à serveur
// (webhooks Daily/Papi, curl) n'envoient pas d'Origin et ne portent pas de
// cookie de session : ils passent, et restent protégés par leur propre
// vérification (signature HMAC, etc.).
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function allowedOrigins(): string[] {
  return (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

export function originCheck(origins: string[] = allowedOrigins()) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (SAFE_METHODS.has(req.method)) return next();
    const origin = req.headers.origin;
    if (!origin || origins.includes(origin.replace(/\/+$/, ""))) return next();
    res.status(403).json({ statusCode: 403, message: "Origine non autorisée." });
  };
}
