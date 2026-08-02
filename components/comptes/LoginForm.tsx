"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

// No auth/backend exists yet. Unlike a generic broken-fetch error, this
// failure is expected and permanent for now, so the message says so plainly
// instead of suggesting "try again later".
const inputClass =
  "w-full rounded border border-white/20 bg-obsidian px-4 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-accent";
const labelClass = "block text-sm font-medium mb-1 text-white/80";

export default function LoginForm() {
  const [matricule, setMatricule] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricule, password }),
      });
      if (!res.ok) throw new Error("failed");
    } catch {
      setStatus("error");
      return;
    }
    setStatus("error");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded border border-accent/20 bg-obsidianCard p-6 sm:p-8"
    >
      <div className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="login-matricule">
            Numéro matricule
          </label>
          <input
            id="login-matricule"
            required
            value={matricule}
            onChange={(e) => setMatricule(e.target.value)}
            placeholder="Communiqué par la RH"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="login-password">
            Mot de passe / code
          </label>
          <input
            id="login-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {status === "error" && (
        <p className="mt-4 text-sm text-accent">
          La connexion n&apos;est pas encore disponible. Cette fonctionnalité
          arrive prochainement.
        </p>
      )}

      <div className="mt-6">
        <Button type="submit" variant="dark" disabled={status === "sending"}>
          {status === "sending" ? "Connexion..." : "Se connecter"}
        </Button>
      </div>
    </form>
  );
}
