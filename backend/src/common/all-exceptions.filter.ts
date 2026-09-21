import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { Request, Response } from "express";

// Filtre global : NestJS gère déjà correctement la réponse HTTP par défaut
// pour une exception non attrapée (message générique "Internal server
// error", pas de fuite de stack trace) — ce qui manquait, c'est un log
// exploitable (contexte de la requête) et un point d'accroche unique pour
// brancher un outil de suivi d'erreurs (Sentry ou équivalent) plus tard
// sans toucher à chaque contrôleur.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("UnhandledException");

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = isHttpException
      ? exception.getResponse()
      : { statusCode: status, message: "Erreur interne du serveur." };

    // Seules les erreurs 5xx (vraiment inattendues) sont logguées ici — les
    // 4xx (401, 404, validation...) sont des refus normaux du flux métier,
    // pas des pannes, et sont déjà assez fréquentes (brute-force, scans,
    // ressources introuvables) pour ne pas mériter un log à chaque fois.
    if (status >= 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(`${request.method} ${request.originalUrl} — ${status} (ip=${request.ip})`, stack);
    }

    response.status(status).json(body);
  }
}
