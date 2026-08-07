import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { EntreprisesProjetsModule } from "./entreprises-projets/entreprises-projets.module";
import { ConnecteursModule } from "./connecteurs/connecteurs.module";
import { EvaluationModule } from "./evaluation/evaluation.module";
import { AuthModule } from "./auth/auth.module";
import { ClasseVirtuelleModule } from "./classe-virtuelle/classe-virtuelle.module";
import { ForumModule } from "./forum/forum.module";
import { NotationModule } from "./notation/notation.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    EntreprisesProjetsModule,
    ConnecteursModule,
    EvaluationModule,
    AuthModule,
    ClasseVirtuelleModule,
    ForumModule,
    NotationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
