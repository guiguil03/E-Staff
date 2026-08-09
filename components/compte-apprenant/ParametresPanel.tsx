"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiPost, ApiError } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

const inputClass =
  "w-full rounded border border-white/20 bg-obsidian px-4 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-accent";
const labelClass = "block text-sm font-medium mb-1 text-white/80";

// Changer son mot de passe — le seul réglage du compte pour l'instant.
// Utile en particulier juste après la première connexion : l'apprenant
// arrive avec un mot de passe temporaire généré automatiquement (voir
// EvaluationService.confirmPayment) et devrait le remplacer par un mot de
// passe de son choix.
export default function ParametresPanel() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
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
      setStatus("error");
      setError(
        err instanceof ApiError
          ? err.message
          : "Une erreur est survenue. Merci de réessayer plus tard."
      );
    }
  }

  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <h3 className="font-display text-base font-semibold text-white">Paramètres</h3>
        <p className="mt-1 font-sans text-xs text-white/50">Changer mon mot de passe</p>

        <form onSubmit={handleSubmit} className="mt-4 max-w-sm space-y-4">
          <div>
            <label className={labelClass} htmlFor="old-password">
              Mot de passe actuel
            </label>
            <input
              id="old-password"
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="new-password-settings">
              Nouveau mot de passe
            </label>
            <input
              id="new-password-settings"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="confirm-password-settings">
              Confirmer le nouveau mot de passe
            </label>
            <input
              id="confirm-password-settings"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && <p className="text-sm text-accent">{error}</p>}
          {status === "done" && (
            <p className="font-sans text-sm text-success">Mot de passe mis à jour.</p>
          )}

          <Button type="submit" variant="dark" disabled={status === "saving"}>
            {status === "saving" ? "Enregistrement..." : "Changer mon mot de passe"}
          </Button>
        </form>
      </div>
    </Reveal>
  );
}
