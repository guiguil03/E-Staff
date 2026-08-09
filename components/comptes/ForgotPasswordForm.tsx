"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { apiPost } from "@/lib/api";

const inputClass =
  "w-full rounded border border-white/20 bg-obsidian px-4 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-accent";
const labelClass = "block text-sm font-medium mb-1 text-white/80";

// Toujours affiche le même message de confirmation, que le matricule existe
// ou non côté serveur (même logique côté backend) — évite de laisser
// deviner quels matricules sont valides.
export default function ForgotPasswordForm() {
  const [matricule, setMatricule] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      await apiPost("/auth/forgot-password", { matricule });
    } catch {
      // volontairement silencieux, voir commentaire ci-dessus
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="rounded border border-accent/40 bg-obsidianCard p-6 text-center">
        <p className="font-display text-lg text-white">Vérifiez vos e-mails</p>
        <p className="mt-3 font-sans text-sm text-white/70">
          Si ce matricule correspond à un compte, un lien de réinitialisation vient d&apos;être
          envoyé (valable 1 heure).
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded border border-accent/20 bg-obsidianCard p-6 sm:p-8">
      <label className={labelClass} htmlFor="forgot-matricule">
        Numéro matricule
      </label>
      <input
        id="forgot-matricule"
        required
        value={matricule}
        onChange={(e) => setMatricule(e.target.value)}
        placeholder="Ex. ETF-2026-0031"
        className={inputClass}
      />
      <div className="mt-6">
        <Button type="submit" variant="dark" disabled={status === "sending"}>
          {status === "sending" ? "Envoi..." : "Envoyer le lien de réinitialisation"}
        </Button>
      </div>
    </form>
  );
}
