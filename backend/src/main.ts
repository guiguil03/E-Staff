import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import basicAuth = require("express-basic-auth");
import * as cookieParser from "cookie-parser";
import * as Sentry from "@sentry/node";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";

async function bootstrap() {
  const logger = new Logger("Bootstrap");

  // Suivi d'erreurs (2026-09-21, audit) — inactif tant que SENTRY_DSN n'est
  // pas renseigné (aucun compte créé à ce jour) : Sentry.init sans DSN est
  // un no-op documenté par le SDK, donc ce bloc ne change rien tant que la
  // variable d'env est vide. Voir all-exceptions.filter.ts pour l'endroit
  // où les erreurs 5xx sont effectivement remontées.
  if (process.env.SENTRY_DSN) {
    Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
  }

  // Erreur explicite au démarrage plutôt qu'un JWT_SECRET manquant
  // découvert au premier login en prod — voir common/session.ts.
  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET n'est pas configuré — obligatoire pour signer les sessions (voir .env.example)."
    );
  }

  // Avertissement (pas un crash) pour les intégrations optionnelles qui
  // dégradent SILENCIEUSEMENT en leur absence (voir EmailService,
  // DailyService, StorageService) — sans ce log, un EMAIL_PROVIDER_API_KEY
  // oublié sur Railway signifie que rappels/contrats/résultats se marquent
  // "envoyés" en base sans qu'aucun e-mail ne parte jamais, et rien ne le
  // signale ailleurs (voir audit du 2026-09-21).
  const missingIntegrations: string[] = [];
  if (!process.env.EMAIL_PROVIDER_API_KEY) {
    missingIntegrations.push("EMAIL_PROVIDER_API_KEY (e-mails simulés/loggués, jamais envoyés)");
  }
  if (!process.env.DAILY_API_KEY) {
    missingIntegrations.push("DAILY_API_KEY (classes virtuelles et Live du Forum indisponibles)");
  }
  if (!process.env.AWS_S3_BUCKET_NAME) {
    missingIntegrations.push("AWS_S3_BUCKET_NAME (upload CV/audio/vidéo indisponible)");
  }
  if (process.env.DAILY_RECORDING_ENABLED === "true" && !process.env.DAILY_WEBHOOK_SECRET) {
    missingIntegrations.push(
      "DAILY_WEBHOOK_SECRET (enregistrement activé mais webhook Daily non configuré : les vidéos ne seront jamais rattachées aux séances)"
    );
  }
  if (!process.env.RH_NOTIFICATION_EMAIL) {
    missingIntegrations.push(
      "RH_NOTIFICATION_EMAIL (la RH n'est jamais prévenue par e-mail des tests corrigés à valider)"
    );
  }
  if (missingIntegrations.length > 0) {
    logger.warn(`Intégrations non configurées au démarrage :\n  - ${missingIntegrations.join("\n  - ")}`);
  }

  // rawBody: true expose req.rawBody sur toutes les routes — nécessaire
  // pour vérifier la signature HMAC des webhooks Daily (voir
  // daily-webhook.controller.ts), qui doit être calculée sur les octets
  // exacts reçus, pas sur une re-sérialisation du JSON parsé.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  // Nécessaire pour lire le cookie de session (voir common/session.ts) dans
  // les guards — Express ne parse pas req.cookies par défaut.
  app.use(cookieParser());

  // Nécessaire pour que `request.ip` reflète la vraie IP du client plutôt
  // que celle du proxy Railway — sinon tous les visiteurs partageraient la
  // même IP côté serveur et le rate-limiting de connexion (login-rate-limit.ts)
  // les verrouillerait tous ensemble après quelques échecs de n'importe qui.
  app.getHttpAdapter().getInstance().set("trust proxy", 1);

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? "http://localhost:3000",
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // Logue toute erreur 5xx non gérée avec le contexte de la requête — voir
  // all-exceptions.filter.ts pour le détail (aucun changement de
  // comportement pour les exceptions déjà gérées ailleurs).
  app.useGlobalFilters(new AllExceptionsFilter());

  // Doc Swagger désactivée tant que SWAGGER_USER/SWAGGER_PASSWORD ne sont
  // pas renseignées (voir .env.example) — évite d'exposer publiquement la
  // liste des routes en production par défaut.
  const swaggerUser = process.env.SWAGGER_USER;
  const swaggerPassword = process.env.SWAGGER_PASSWORD;
  if (swaggerUser && swaggerPassword) {
    app.use(
      "/api/docs",
      basicAuth({
        challenge: true,
        users: { [swaggerUser]: swaggerPassword },
      })
    );

    const swaggerConfig = new DocumentBuilder()
      .setTitle("E-Staff API")
      .setDescription("Documentation de l'API E-Staff")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, swaggerDocument);
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
}
bootstrap();
