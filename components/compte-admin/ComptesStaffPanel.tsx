"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiGet, apiPostAuthed, apiPut, ApiError } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface CompteStaff {
  id: string;
  matricule: string;
  role: "admin" | "rh";
  prenom: string;
  nom: string;
  email: string;
  actif: boolean;
}

interface ListeApi {
  comptes: CompteStaff[];
  identifiantsPartages: Record<"admin" | "rh", { configure: boolean; actif: boolean }>;
}

const LIBELLE = { admin: "Admin", rh: "RH" } as const;
const inputClass =
  "mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent";
const labelClass = "block font-mono text-xs uppercase tracking-widest text-white/50";

// Paramètres > Comptes d'accès (audit du 2026-09-28) : un compte personnel
// par personne pour l'Admin et la RH, à la place des identifiants partagés.
export default function ComptesStaffPanel() {
  const [data, setData] = useState<ListeApi | "loading" | "erreur">("loading");
  const [form, setForm] = useState({ role: "rh" as "admin" | "rh", prenom: "", nom: "", email: "" });
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [message, setMessage] = useState<string | null>(null);
  // Mot de passe temporaire affiché une seule fois, après création/régénération.
  const [identifiants, setIdentifiants] = useState<{ nom: string; matricule: string; motDePasse: string } | null>(null);

  function refresh() {
    apiGet<ListeApi>("/comptes-staff", adminHeaders())
      .then(setData)
      .catch(() => setData("erreur"));
  }
  useEffect(refresh, []);

  async function creer() {
    setStatus("saving");
    setMessage(null);
    try {
      const res = await apiPostAuthed<{ compte: CompteStaff; motDePasseTemporaire: string }>(
        "/comptes-staff",
        form,
        adminHeaders()
      );
      setIdentifiants({
        nom: `${res.compte.prenom} ${res.compte.nom}`,
        matricule: res.compte.matricule,
        motDePasse: res.motDePasseTemporaire,
      });
      setForm((f) => ({ ...f, prenom: "", nom: "", email: "" }));
      refresh();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Création impossible — réessayez.");
    } finally {
      setStatus("idle");
    }
  }

  async function basculer(c: CompteStaff) {
    setMessage(null);
    try {
      await apiPut(`/comptes-staff/${c.id}/actif`, { actif: !c.actif }, adminHeaders());
      refresh();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Modification impossible — réessayez.");
    }
  }

  async function regenerer(c: CompteStaff) {
    setMessage(null);
    try {
      const res = await apiPostAuthed<{ motDePasseTemporaire: string }>(
        `/comptes-staff/${c.id}/regenerer-mot-de-passe`,
        {},
        adminHeaders()
      );
      setIdentifiants({ nom: `${c.prenom} ${c.nom}`, matricule: c.matricule, motDePasse: res.motDePasseTemporaire });
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Régénération impossible — réessayez.");
    }
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <h3 className="font-display text-base font-semibold text-white">Comptes d&apos;accès Admin &amp; RH</h3>
          <p className="mt-1 max-w-2xl font-sans text-sm text-white/60">
            Un compte personnel par personne : chacun a son matricule et son mot de passe, et vous pouvez couper
            l&apos;accès d&apos;une personne sans changer celui des autres.
          </p>

          {data !== "loading" && data !== "erreur" && (
            <div className="mt-4 space-y-2">
              {(["admin", "rh"] as const).map((role) => {
                const p = data.identifiantsPartages[role];
                if (!p.configure) return null;
                return (
                  <p
                    key={role}
                    className={`rounded border px-3 py-2 font-sans text-xs ${
                      p.actif ? "border-statusOrange/40 text-statusOrange" : "border-statusGreen/40 text-statusGreen"
                    }`}
                  >
                    {p.actif
                      ? `Identifiant partagé ${LIBELLE[role]} encore actif : il sera désactivé automatiquement dès que vous créerez un premier compte ${LIBELLE[role]} personnel. Créez d'abord le vôtre avant de vous déconnecter.`
                      : `Identifiant partagé ${LIBELLE[role]} désactivé : seuls les comptes personnels ci-dessous peuvent se connecter.`}
                  </p>
                );
              })}
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <div>
              <label className={labelClass} htmlFor="staff-role">Rôle</label>
              <select
                id="staff-role"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as "admin" | "rh" }))}
                className={inputClass}
              >
                <option value="rh">RH</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="staff-prenom">Prénom</label>
              <input id="staff-prenom" value={form.prenom} onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="staff-nom">Nom</label>
              <input id="staff-nom" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="staff-email">E-mail</label>
              <input id="staff-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} />
            </div>
          </div>
          <div className="mt-4">
            <Button
              variant="dark"
              onClick={creer}
              disabled={status === "saving" || !form.prenom.trim() || !form.nom.trim() || !form.email.includes("@")}
            >
              {status === "saving" ? "Création..." : "Créer le compte"}
            </Button>
          </div>

          {identifiants && (
            <div className="mt-4 rounded border border-accent/40 bg-obsidian p-4 font-sans text-sm text-white">
              <p>
                Identifiants de <strong>{identifiants.nom}</strong> (envoyés aussi par e-mail) — notez-les, le mot
                de passe ne sera plus affiché :
              </p>
              <p className="mt-2 font-mono">
                Matricule : {identifiants.matricule}
                <br />
                Mot de passe temporaire : {identifiants.motDePasse}
              </p>
              <button type="button" onClick={() => setIdentifiants(null)} className="mt-2 font-sans text-xs text-white/50 hover:text-accent">
                Masquer
              </button>
            </div>
          )}
          {message && <p className="mt-3 font-sans text-sm text-accent">{message}</p>}
        </div>
      </Reveal>

      <Reveal>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          {data === "loading" && <p className="font-sans text-sm text-white/50">Chargement...</p>}
          {data === "erreur" && <p className="font-sans text-sm text-white/50">Impossible de charger les comptes.</p>}
          {data !== "loading" && data !== "erreur" && data.comptes.length === 0 && (
            <p className="font-sans text-sm text-white/50">Aucun compte personnel pour l&apos;instant.</p>
          )}
          {data !== "loading" && data !== "erreur" && data.comptes.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] font-sans text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs text-white/40">
                    <th className="py-2 pr-3 font-mono font-normal">Personne</th>
                    <th className="py-2 pr-3 font-mono font-normal">Rôle</th>
                    <th className="py-2 pr-3 font-mono font-normal">Matricule</th>
                    <th className="py-2 pr-3 font-mono font-normal">Statut</th>
                    <th className="py-2 font-mono font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.comptes.map((c) => (
                    <tr key={c.id} className="border-b border-white/5">
                      <td className="py-2 pr-3 text-white">
                        {c.prenom} {c.nom}
                        <span className="block text-xs text-white/40">{c.email}</span>
                      </td>
                      <td className="py-2 pr-3 text-white/70">{LIBELLE[c.role]}</td>
                      <td className="py-2 pr-3 font-mono text-white/70">{c.matricule}</td>
                      <td className={`py-2 pr-3 ${c.actif ? "text-statusGreen" : "text-white/40"}`}>
                        {c.actif ? "Actif" : "Désactivé"}
                      </td>
                      <td className="py-2 text-right">
                        <button type="button" onClick={() => regenerer(c)} className="mr-3 text-xs text-white/60 hover:text-accent">
                          Nouveau mot de passe
                        </button>
                        <button
                          type="button"
                          onClick={() => basculer(c)}
                          className={`text-xs ${c.actif ? "text-statusRed" : "text-statusGreen"} hover:underline`}
                        >
                          {c.actif ? "Désactiver" : "Réactiver"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
