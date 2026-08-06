import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  // rawBody: true expose req.rawBody sur toutes les routes — nécessaire
  // pour vérifier la signature HMAC des webhooks Daily (voir
  // daily-webhook.controller.ts), qui doit être calculée sur les octets
  // exacts reçus, pas sur une re-sérialisation du JSON parsé.
  const app = await NestFactory.create(AppModule, { rawBody: true });

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

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
}
bootstrap();
