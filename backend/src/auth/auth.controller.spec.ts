import { PATH_METADATA } from "@nestjs/common/constants";
import { AuthController } from "./auth.controller";
import { RhController } from "../rh/rh.controller";
import { StaffGuard } from "../common/staff.guard";

// Express sert la première route qui correspond, dans l'ordre de déclaration.
// `view-as/consume` doit donc précéder `view-as/:matricule`, sinon "consume"
// est lu comme un matricule : la garde RH répond 401 au nouvel onglet de
// « Se connecter en tant que » et le jeton n'est jamais consommé.
describe("AuthController — ordre des routes", () => {
  function routesEnOrdre(): string[] {
    const proto = AuthController.prototype as unknown as Record<string, unknown>;
    return Object.getOwnPropertyNames(proto)
      .map((nom) => proto[nom])
      .filter((handler): handler is object => typeof handler === "function")
      .map((handler) => Reflect.getMetadata(PATH_METADATA, handler) as string | undefined)
      .filter((chemin): chemin is string => typeof chemin === "string");
  }

  it("déclare view-as/consume avant la route paramétrée view-as/:matricule", () => {
    const routes = routesEnOrdre();
    const consume = routes.indexOf("view-as/consume");
    const parametree = routes.indexOf("view-as/:matricule");

    expect(consume).toBeGreaterThanOrEqual(0);
    expect(parametree).toBeGreaterThanOrEqual(0);
    expect(consume).toBeLessThan(parametree);
  });
});

// Le Registre est affiché par Académie (Admin) et par le pilotage RH, avec
// un bouton « Se connecter en tant que » : un garde réservé au rôle RH
// renvoyait 401 à l'Admin sur sa propre page.
describe("Gardes du Registre — Admin et RH", () => {
  function gardes(cible: object, methode: string): unknown[] {
    return Reflect.getMetadata("__guards__", (cible as Record<string, unknown>)[methode] as object) ?? [];
  }

  it("GET /rh/registre accepte le staff (Admin ou RH)", () => {
    expect(gardes(RhController.prototype, "getRegistre")).toContain(StaffGuard);
  });

  it("POST /auth/view-as/:matricule accepte le staff (Admin ou RH)", () => {
    expect(gardes(AuthController.prototype, "createViewAs")).toContain(StaffGuard);
  });
});
