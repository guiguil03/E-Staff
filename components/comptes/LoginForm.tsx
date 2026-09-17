"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { apiPost, ApiError } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY, ACCOUNT_ROLE_KEY, ROLE_ROUTES } from "@/lib/accountSession";

// Login générique — un seul endpoint pour tous les rôles, en attendant le
// vrai système de comptes/matricules RH (module 7 de la roadmap). Le rôle
// renvoyé par le backend détermine où rediriger. Un simple flag
// sessionStorage protège les tableaux de bord côté client ; ce n'est pas
// une vraie session, juste assez pour démontrer le design.

const inputClass =
  "w-full rounded border border-white/20 bg-obsidian px-4 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-accent";
const labelClass = "block text-sm font-medium mb-1 text-white/80";

export default function LoginForm() {
  const router = useRouter();
  const [matricule, setMatricule] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const res = await apiPost<{ ok: boolean; role: string }>("/auth/login", {
        matricule,
        password,
      });
      sessionStorage.setItem(ACCOUNT_ROLE_KEY, res.role);
      sessionStorage.setItem(ACCOUNT_MATRICULE_KEY, matricule);
      router.push(ROLE_ROUTES[res.role] ?? "/");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof ApiError
          // 401 = identifiants invalides, message générique volontaire (pas
          // d'indice sur quel champ est faux). Tout autre statut (429
          // "Trop de tentatives..." de l'anti-brute-force, 500...) doit
          // remonter son vrai message : sinon un verrouillage temporaire
          // s'affichait identique à un mauvais mot de passe, illisible pour
          // l'utilisateur qui retape pourtant le bon (bug relevé le
          // 2026-09-18).
          ? err.status === 401
            ? "Matricule ou mot de passe invalide."
            : err.message
          : "Une erreur est survenue. Merci de réessayer plus tard."
      );
    }
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
          <Link
            href="/mot-de-passe-oublie"
            className="mt-1.5 inline-block font-mono text-xs text-white/40 hover:text-accent hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>
      </div>

      {status === "error" && error && (
        <p className="mt-4 text-sm text-accent">{error}</p>
      )}

      <div className="mt-6">
        <Button type="submit" variant="dark" disabled={status === "sending"}>
          {status === "sending" ? "Connexion..." : "Se connecter"}
        </Button>
      </div>
    </form>
  );
}
