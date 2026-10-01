import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('Système')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHealth(): string {
    return this.appService.getHello();
  }

  // Utilisé par le monitoring Railway/uptime (voir README) — vérifie
  // réellement la connexion DB plutôt que de renvoyer un simple 200 fixe :
  // un backend qui répond mais n'arrive plus à parler à Postgres doit être
  // signalé comme en panne, pas comme sain.
  @Get('health')
  async getHealthCheck() {
    const startedAt = Date.now();
    const uptimeSeconds = Math.round(process.uptime());
    const timestamp = new Date().toISOString();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: true, latencyMs: Date.now() - startedAt, uptimeSeconds, timestamp };
    } catch {
      // 503, pas 200 : un monitoring qui ne regarde que le code HTTP (cas
      // le plus courant) doit voir une panne, pas un "ok" trompeur.
      throw new HttpException(
        { status: 'error', database: false, uptimeSeconds, timestamp },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
