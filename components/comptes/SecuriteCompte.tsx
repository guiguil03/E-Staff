"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { apiPost, ApiError } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY, ACCOUNT_ROLE_KEY } from "@/lib/accountSession";
import { useRequireRole } from "@/lib/useRequireRole";

const inputClass =
  "w-full rounded border border-white/20 bg-obsidian px-4 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-accent";
const labelClass = "block text-sm font-medium mb-1 text-white/80";

// Sécurité du compte, pour tous les rôles (audit du 2026-09-28) :
// changer son mot de passe (déconnecte les autres appareils) et
// « Déconnecter tous mes appareils ».
export default function SecuriteCompte() {
  const checked = useRequireRole(["apprenant", "formateur", "admin", "rh"]);
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [deconnexion, setDeconnexion] = useState<"idle" | "confirm" | "saving">("idle");

  if (!checked) return null;

  async function changer(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) return setError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
    if (newPassword !== confirm) return setError("Les deux mots de passe ne correspondent pas.");
    const matricule = sessionStorage.getItem(ACCOUNT_MATRICULE_KEY);
    if (!matricule) return;
    setStatus("saving");
    setError(null);
    try {
      await apiPost("/auth/change-password", { matricule, oldPassword, newPassword });
      setStatus("done");
      setOldPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue. Merci de réessayer plus tard.");
    }
  }

  async function deconnecterPartout() {
    setDeconnexion("saving");
    try {
      await apiPost("/auth/logout-everywhere", {});
    } catch {
      // Session déjà invalide : on déconnecte quand même ce navigateur.
    }
    sessionStorage.removeItem(ACCOUNT_ROLE_KEY);
    sessionStorage.removeItem(ACCOUNT_MATRICULE_KEY);
    router.push("/connexion");
  }

  return (
    <div className="space-y-8">
      <section className="rounded border border-white/10 bg-obsidianCard p-6">
        <h2 className="font-display text-lg font-semibold text-white">Changer mon mot de passe</h2>
        <p className="mt-1 font-sans text-xs text-white/50">
          Vos autres appareils seront déconnectés ; celui-ci reste connecté.
        </p>
        <form onSubmit={changer} className="mt-4 max-w-sm space-y-4">
          <div>
            <label className={labelClass} htmlFor="securite-ancien">Mot de passe actuel</label>
            <input id="securite-ancien" type="password" required autoComplete="current-password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="securite-nouveau">Nouveau mot de passe</label>
            <input id="securite-nouveau" type="password" required autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="securite-confirmer">Confirmer le nouveau mot de passe</label>
            <input id="securite-confirmer" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
          </div>
          {error && <p className="text-sm text-accent">{error}</p>}
          {status === "done" && <p className="font-sans text-sm text-success">Mot de passe mis à jour.</p>}
          <Button type="submit" variant="dark" disabled={status === "saving"}>
            {status === "saving" ? "Enregistrement..." : "Changer mon mot de passe"}
          </Button>
        </form>
      </section>

      <section className="rounded border border-white/10 bg-obsidianCard p-6">
        <h2 className="font-display text-lg font-semibold text-white">Déconnecter tous mes appareils</h2>
        <p className="mt-1 max-w-lg font-sans text-sm text-white/60">
          Téléphone perdu, ordinateur partagé ? Toutes les sessions ouvertes avec votre compte sont coupées
          immédiatement, y compris celle-ci.
        </p>
        {deconnexion === "idle" ? (
          <button
            type="button"
            onClick={() => setDeconnexion("confirm")}
            className="mt-4 rounded border border-statusRed/50 px-4 py-2 font-sans text-sm text-statusRed hover:bg-statusRed/10"
          >
            Déconnecter tous mes appareils
          </button>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={deconnecterPartout}
              disabled={deconnexion === "saving"}
              className="rounded bg-statusRed px-4 py-2 font-sans text-sm font-semibold text-white hover:bg-statusRed/90 disabled:opacity-60"
            >
              {deconnexion === "saving" ? "Déconnexion..." : "Oui, tout déconnecter"}
            </button>
            <button type="button" onClick={() => setDeconnexion("idle")} className="font-sans text-sm text-white/60 hover:text-accent">
              Annuler
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
