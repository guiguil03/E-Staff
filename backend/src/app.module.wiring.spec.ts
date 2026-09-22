import { Test } from "@nestjs/testing";
import { AppModule } from "./app.module";

// Vérifie que le graphe de dépendances Nest (tous les modules, providers,
// controllers) s'assemble sans erreur — aucune requête DB réelle (compile()
// ne déclenche pas les hooks de cycle de vie comme PrismaService.onModuleInit).
// Sans ce test, une erreur de câblage (import de module manquant, provider
// non exporté...) n'était détectée qu'au démarrage réel sur Railway, jamais
// en CI : `nest build` ne valide que la compilation TypeScript, pas le DI.
describe("AppModule (câblage)", () => {
  it("compile sans erreur de dépendances", async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    expect(moduleRef).toBeDefined();
    await moduleRef.close();
  });
});
