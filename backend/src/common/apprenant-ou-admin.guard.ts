import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { exigerSession } from "./garde-session";

// Gate du Forum (salle live) : accessible aux apprenants (seul tableau de
// bord qui y pointe, voir QuickActions "Accéder au Forum") et aux admins
// (qui obtiennent le jeton hôte Daily, voir ForumController.getLiveRoom).
// Même principe que StaffGuard/FormateurOuRhGuard (deux rôles), pour
// apprenant OU admin.
@Injectable()
export class ApprenantOuAdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    await exigerSession(request, {
      cle: "apprenant-ou-admin",
      roles: ["apprenant", "admin"],
      message: "Accès refusé.",
    });
    return true;
  }
}
