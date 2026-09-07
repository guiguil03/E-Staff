import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import basicAuth = require("express-basic-auth");
import { AppModule } from "./app.module";

async function bootstrap() {
  // rawBody: true expose req.rawBody sur toutes les routes — nécessaire
  // pour vérifier la signature HMAC des webhooks Daily (voir
  // daily-webhook.controller.ts), qui doit être calculée sur les octets
  // exacts reçus, pas sur une re-sérialisation du JSON parsé.
  const app = await NestFactory.create(AppModule, { rawBody: true });

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
