import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../common/email.service";
import { credentialsBox, emailParagraph, escapeHtml, renderEmailHtml } from "../common/email-template";
import { identifiantPartage } from "../common/session";
import { CreateCompteStaffDto } from "./comptes-staff.dto";

// Caractères des mots de passe temporaires, sans ambigus (0/O, 1/l/I) — même
// alphabet que RhService.
const ALPHABET_TEMPORAIRE = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
function motDePasseTemporaire(length = 12): string {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => ALPHABET_TEMPORAIRE[b % ALPHABET_TEMPORAIRE.length]).join("");
}

const LIBELLE_ROLE = { admin: "Admin", rh: "RH" } as const;

// Comptes nominatifs Admin / RH (audit du 2026-09-28) — remplacent les
// identifiants partagés ADMIN_TEST_* / RH_TEST_*. Le premier compte actif
// d'un rôle désactive l'identifiant partagé de ce rôle (voir
// common/session.ts, identifiantPartageAutorise).
@Injectable()
export class ComptesStaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService
  ) {}

  private serialize(c: {
    id: string;
    matricule: string;
    role: string;
    prenom: string;
    nom: string;
    email: string;
    actif: boolean;
    createdAt: Date;
  }) {
    const { id, matricule, role, prenom, nom, email, actif, createdAt } = c;
    return { id, matricule, role, prenom, nom, email, actif, createdAt };
  }

  async list() {
    const comptes = await this.prisma.compteStaff.findMany({ orderBy: [{ role: "asc" }, { nom: "asc" }] });
    const actifs = (role: "admin" | "rh") => comptes.some((c) => c.role === role && c.actif);
    return {
      comptes: comptes.map((c) => this.serialize(c)),
      // Pour l'avertissement de l'écran : l'identifiant partagé fonctionne-t-il encore ?
      identifiantsPartages: {
        admin: { configure: !!identifiantPartage("admin").matricule, actif: !actifs("admin") },
        rh: { configure: !!identifiantPartage("rh").matricule, actif: !actifs("rh") },
      },
    };
  }

  private async prochainMatricule(role: "admin" | "rh") {
    const prefixe = `${role === "admin" ? "ADM" : "RH"}-${new Date().getFullYear()}-`;
    const dernier = await this.prisma.compteStaff.findFirst({
      where: { matricule: { startsWith: prefixe } },
      orderBy: { matricule: "desc" },
    });
    const n = dernier ? Number.parseInt(dernier.matricule.slice(prefixe.length), 10) + 1 : 1;
    return `${prefixe}${String(n).padStart(4, "0")}`;
  }

  private async envoyerIdentifiants(
    compte: { prenom: string; email: string; matricule: string; role: string },
    motDePasse: string,
    nouveau: boolean
  ) {
    const role = LIBELLE_ROLE[compte.role as "admin" | "rh"] ?? compte.role;
    return this.email.send({
      to: compte.email,
      subject: nouveau ? `Votre accès ${role} e-Staf` : `Vos nouveaux identifiants ${role} e-Staf`,
      text: `Bonjour ${compte.prenom},\n\n${nouveau ? `Un compte ${role} personnel a été créé pour vous sur e-Staf.` : "Voici vos nouveaux identifiants e-Staf."}\n\nMatricule : ${compte.matricule}\nMot de passe temporaire : ${motDePasse}\n\nChangez ce mot de passe après votre première connexion.\n\nL'équipe e-Staf`,
      html: renderEmailHtml({
        title: nouveau ? `Votre accès ${role}` : "Vos nouveaux identifiants",
        preheader: "Vos identifiants de connexion e-Staf",
        bodyHtml:
          emailParagraph(`Bonjour ${escapeHtml(compte.prenom)},`) +
          emailParagraph(
            nouveau ? `Un compte ${role} personnel a été créé pour vous sur e-Staf.` : "Voici vos nouveaux identifiants e-Staf."
          ) +
          credentialsBox([
            { label: "Matricule", value: compte.matricule },
            { label: "Mot de passe temporaire", value: motDePasse },
          ]) +
          emailParagraph("Changez ce mot de passe après votre première connexion."),
      }),
    });
  }

  // Le mot de passe temporaire est aussi renvoyé une fois à l'admin, pour
  // pouvoir le transmettre si l'e-mail n'arrive pas.
  async create(dto: CreateCompteStaffDto) {
    const matricule = await this.prochainMatricule(dto.role);
    const motDePasse = motDePasseTemporaire();
    const compte = await this.prisma.compteStaff.create({
      data: { ...dto, email: dto.email.trim(), matricule, password: await bcrypt.hash(motDePasse, 10) },
    });
    await this.envoyerIdentifiants(compte, motDePasse, true);
    return { compte: this.serialize(compte), motDePasseTemporaire: motDePasse };
  }

  private async getOrThrow(id: string) {
    const compte = await this.prisma.compteStaff.findUnique({ where: { id } });
    if (!compte) throw new NotFoundException("Compte introuvable.");
    return compte;
  }

  // Désactiver coupe aussi toutes les sessions en cours.
  async setActif(id: string, actif: boolean, matriculeConnecte: string) {
    const compte = await this.getOrThrow(id);
    if (!actif && compte.matricule === matriculeConnecte) {
      throw new BadRequestException("Vous ne pouvez pas désactiver votre propre compte.");
    }
    const maj = await this.prisma.compteStaff.update({
      where: { id },
      data: { actif, ...(actif ? {} : { sessionsRevoqueesAt: new Date() }) },
    });
    return this.serialize(maj);
  }

  async regenererMotDePasse(id: string) {
    const compte = await this.getOrThrow(id);
    const motDePasse = motDePasseTemporaire();
    await this.prisma.compteStaff.update({
      where: { id },
      data: { password: await bcrypt.hash(motDePasse, 10), sessionsRevoqueesAt: new Date() },
    });
    await this.envoyerIdentifiants(compte, motDePasse, false);
    return { ok: true, motDePasseTemporaire: motDePasse };
  }
}
