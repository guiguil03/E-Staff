import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import basicAuth = require("express-basic-auth");
import * as cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";

async function bootstrap() {
  // Erreur explicite au démarrage plutôt qu'un JWT_SECRET manquant
  // découvert au premier login en prod — voir common/session.ts.
  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET n'est pas configuré — obligatoire pour signer les sessions (voir .env.example)."
    );
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
