"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { apiPost, ApiError } from "@/lib/api";

const inputClass =
  "w-full rounded border border-white/20 bg-obsidian px-4 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-accent";
const labelClass = "block text-sm font-medium mb-1 text-white/80";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="rounded border border-white/10 bg-obsidianCard p-6 text-center">
        <p className="font-sans text-sm text-white/70">
          Lien invalide — vérifiez que vous avez bien copié le lien complet reçu par e-mail.
        </p>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="rounded border border-accent/40 bg-obsidianCard p-6 text-center">
        <p className="font-display text-lg text-white">Mot de passe mis à jour</p>
        <p className="mt-3 font-sans text-sm text-white/70">
          Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
        </p>
        <div className="mt-5">
          <Button variant="dark" onClick={() => router.push("/connexion")}>
            Aller à la connexion
          </Button>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setStatus("sending");
    setError(null);
    try {
      await apiPost("/auth/reset-password", { token, newPassword });
      setStatus("done");
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
    <form onSubmit={handleSubmit} className="rounded border border-accent/20 bg-obsidianCard p-6 sm:p-8">
      <div className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="new-password">
            Nouveau mot de passe
          </label>
          <input
            id="new-password"
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="confirm-password">
            Confirmer le mot de passe
          </label>
          <input
            id="confirm-password"
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-accent">{error}</p>}

      <div className="mt-6">
        <Button type="submit" variant="dark" disabled={status === "sending"}>
          {status === "sending" ? "Enregistrement..." : "Choisir ce mot de passe"}
        </Button>
      </div>
    </form>
  );
}
