import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { EntreprisesProjetsModule } from "./entreprises-projets/entreprises-projets.module";
import { ConnecteursModule } from "./connecteurs/connecteurs.module";
import { EvaluationModule } from "./evaluation/evaluation.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EntreprisesProjetsModule,
    ConnecteursModule,
    EvaluationModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
