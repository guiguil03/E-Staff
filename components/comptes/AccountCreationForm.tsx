"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { ACCOUNT_ROLES } from "./roles";

// No backend/database exists yet. This form follows the same honest pattern
// as components/RegistrationForm.tsx: local state, a POST to an API route
// that isn't wired up yet, and a graceful failure message — never a fake
// success. The "envoi" of this request is a request to be contacted by RH,
// not the creation of a working account (per the client's own sequence:
// test / convention / entretien RH → attribution du matricule → accès).

const inputClass =
  "w-full rounded border border-muted/30 bg-white px-4 py-2 font-sans text-sm text-ink placeholder:text-muted/60 outline-none transition-colors focus:border-primary";
const labelClass = "block text-sm font-medium mb-1 text-ink";
const stepBadgeClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-semibold text-white";

export default function AccountCreationForm() {
  const [roleId, setRoleId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  const selectedRole = ACCOUNT_ROLES.find((role) => role.id === roleId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/account-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: roleId, firstName, email, phone }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded border border-success/30 bg-success/5 p-6 sm:p-8">
        <p className="font-display text-lg text-ink">
          Merci{firstName ? `, ${firstName}` : ""}. Votre demande est
          enregistrée.
        </p>
        <p className="mt-2 text-sm text-muted">
          Un membre de l&apos;équipe RH vous contactera pour la suite du
          processus (test, entretien ou signature selon votre profil).
          Aucun compte n&apos;est actif tant que le numéro matricule ne vous
          a pas été communiqué.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Étape 1 — Profil */}
      <div className="rounded border border-muted/20 bg-white p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className={stepBadgeClass}>1</span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-semibold text-primary">
              Choisissez votre profil
            </h2>
            <p className="mt-1 text-sm text-muted">
              Sélectionnez le rôle qui correspond à votre situation. Certains
              profils sont réservés et attribués directement par e-Staf.
            </p>

            <div className="mt-4">
              <label className={labelClass} htmlFor="role-select">
                Profil
              </label>
              <select
                id="role-select"
                required
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className={`${inputClass} bg-white`}
              >
                <option value="" disabled>
                  Sélectionnez un profil
                </option>
                {ACCOUNT_ROLES.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedRole && (
              <div className="mt-4 rounded border border-accent/30 bg-accent/5 px-4 py-3">
                <p className="font-sans text-sm font-medium text-primary">
                  {selectedRole.label}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {selectedRole.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Étape 2 — Coordonnées */}
      <div className="rounded border border-muted/20 bg-white p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className={stepBadgeClass}>2</span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-semibold text-primary">
              Vos coordonnées
            </h2>
            <p className="mt-1 text-sm text-muted">
              Ces informations permettent à l&apos;équipe RH de vous
              recontacter pour la suite du processus.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass} htmlFor="account-firstname">
                  Prénom
                </label>
                <input
                  id="account-firstname"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="account-email">
                  Email
                </label>
                <input
                  id="account-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="account-phone">
                  Téléphone
                </label>
                <input
                  id="account-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Étape 3 — Validation & matricule */}
      <div className="rounded border border-muted/20 bg-white p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className={stepBadgeClass}>3</span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-semibold text-primary">
              Validation &amp; matricule
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink">
              Votre compte n&apos;est pas activé immédiatement. L&apos;accès
              à votre espace personnel nécessite au préalable l&apos;une des
              conditions suivantes :
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-ink">
              <li className="flex gap-2">
                <span className="text-accent">—</span>
                <span>
                  Réussir le test correspondant à votre profil et valider
                  votre inscription,
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">—</span>
                <span>
                  ou signer une convention de partenariat ou de collaboration,
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">—</span>
                <span>
                  ou obtenir la validation d&apos;un entretien avec
                  l&apos;équipe RH.
                </span>
              </li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Une fois l&apos;une de ces conditions remplie, l&apos;équipe RH
              vous attribue un numéro matricule unique. Ce matricule active
              l&apos;accès à votre tableau de bord personnel.
            </p>

            <div className="mt-4">
              <label className={labelClass} htmlFor="account-matricule">
                Numéro matricule
              </label>
              <input
                id="account-matricule"
                disabled
                readOnly
                value="En attente d'attribution par la RH"
                className={`${inputClass} cursor-not-allowed bg-background text-muted opacity-80`}
              />
              <p className="mt-1 text-xs text-muted">
                Ce champ est renseigné par la RH, pas par vous — il ne se
                remplit pas au moment de l&apos;inscription.
              </p>
            </div>
          </div>
        </div>
      </div>

      {status === "error" && (
        <p className="text-sm text-primary">
          Une erreur est survenue. Merci de réessayer plus tard.
        </p>
      )}

      <div>
        <Button type="submit" variant="primary" disabled={status === "sending"}>
          {status === "sending" ? "Envoi..." : "Envoyer ma demande"}
        </Button>
      </div>
    </form>
  );
}
