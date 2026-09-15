"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiDelete, apiGet, apiPostAuthed, apiPut } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface LigneTypeCours {
  typeCours: string;
  nbInscrits: number;
  totalEncaisse: number;
}

interface LigneTendance {
  semaine?: string;
  periode?: string;
  totalEncaisse: number;
}

interface Encaissement {
  id: string;
  apprenantId: string;
  apprenantNom: string;
  typeCours: string | null;
  montant: number;
  jour: string;
  moyenPaiement: string | null;
}

interface ApprenantOption {
  id: string;
  matricule: string;
  nomComplet: string;
  typeCours: string;
}

function fmtMontant(n: number): string {
  return `${n.toLocaleString("fr-FR")} Ar`;
}

function fmtJour(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR");
}

function fmtSemaine(s: string): string {
  const [year, week] = s.split("-W");
  return `S${week} · ${year}`;
}

function fmtPeriode(p: string): string {
  const [y, m] = p.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("fr-FR", {
    month: "short",
    year: "numeric",
  });
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded border border-white/10 bg-obsidianCard p-5">
      <p className="font-mono text-[11px] uppercase tracking-widest text-white/50">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-accent">{value}</p>
      {sub && <p className="mt-0.5 font-mono text-[11px] text-white/40">{sub}</p>}
    </div>
  );
}

const emptyForm = { apprenantId: "", montant: "", jour: "", moyenPaiement: "" };

// Encaissements réels de la formation — comble le vide identifié dans
// EtatFinancierFormationPanel (qui ne calcule qu'un CA théorique, aucune
// facture/paiement numérique réel). Journal saisi manuellement par la RH
// (pas de webhook Mobile Money), ventilé par type de cours (voir
// RhService.getEncaissementsFormation, trié du plus au moins rentable — la
// première ligne est donc toujours le type de cours qui a le plus rapporté),
// avec comparatifs hebdomadaire et mensuel côte à côte.
export default function EncaissementsFormationPanel() {
  const [lignes, setLignes] = useState<LigneTypeCours[] | "loading" | "erreur">("loading");
  const [hebdo, setHebdo] = useState<LigneTendance[] | "loading" | "erreur">("loading");
  const [mensuel, setMensuel] = useState<LigneTendance[] | "loading" | "erreur">("loading");
  const [historique, setHistorique] = useState<Encaissement[] | "loading" | "erreur">("loading");
  const [apprenants, setApprenants] = useState<ApprenantOption[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editStatus, setEditStatus] = useState<"idle" | "saving" | "error">("idle");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function refresh() {
    apiGet<LigneTypeCours[]>("/rh/encaissements-formation", adminHeaders())
      .then(setLignes)
      .catch(() => setLignes("erreur"));
    apiGet<LigneTendance[]>("/rh/encaissements/tendance-hebdomadaire", adminHeaders())
      .then(setHebdo)
      .catch(() => setHebdo("erreur"));
    apiGet<LigneTendance[]>("/rh/encaissements/tendance-mensuelle", adminHeaders())
      .then(setMensuel)
      .catch(() => setMensuel("erreur"));
    apiGet<Encaissement[]>("/rh/encaissements", adminHeaders())
      .then(setHistorique)
      .catch(() => setHistorique("erreur"));
    apiGet<ApprenantOption[]>("/rh/apprenants-pour-encaissement", adminHeaders())
      .then(setApprenants)
      .catch(() => {});
  }

  useEffect(refresh, []);

  async function createEncaissement() {
    if (!form.apprenantId || !form.montant || !form.jour) return;
    setStatus("saving");
    try {
      await apiPostAuthed(
        "/rh/encaissements",
        {
          apprenantId: form.apprenantId,
          montant: Number(form.montant),
          jour: form.jour,
          moyenPaiement: form.moyenPaiement || undefined,
        },
        adminHeaders()
      );
      setForm(emptyForm);
      setOpen(false);
      setStatus("idle");
      refresh();
    } catch {
      setStatus("error");
    }
  }

  function startEdit(e: Encaissement) {
    setEditingId(e.id);
    setEditForm({
      apprenantId: e.apprenantId,
      montant: String(e.montant),
      jour: e.jour.slice(0, 10),
      moyenPaiement: e.moyenPaiement ?? "",
    });
    setEditStatus("idle");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(emptyForm);
    setEditStatus("idle");
  }

  async function saveEdit(id: string) {
    const montant = Number(editForm.montant);
    if (!editForm.apprenantId || !editForm.jour || !editForm.montant || Number.isNaN(montant)) return;
    setEditStatus("saving");
    try {
      await apiPut(
        `/rh/encaissements/${id}`,
        {
          apprenantId: editForm.apprenantId,
          montant,
          jour: editForm.jour,
          moyenPaiement: editForm.moyenPaiement || undefined,
        },
        adminHeaders()
      );
      setEditingId(null);
      setEditForm(emptyForm);
      setEditStatus("idle");
      refresh();
    } catch {
      setEditStatus("error");
    }
  }

  async function removeEncaissement(e: Encaissement) {
    if (
      !window.confirm(
        `Supprimer l'encaissement de ${fmtMontant(e.montant)} pour ${e.apprenantNom} du ${fmtJour(e.jour)} ? Cette action est irréversible.`
      )
    )
      return;
    setDeletingId(e.id);
    try {
      await apiDelete(`/rh/encaissements/${e.id}`, adminHeaders());
      refresh();
    } finally {
      setDeletingId(null);
    }
  }

  const totalEncaisse =
    Array.isArray(lignes) ? round2(lignes.reduce((sum, l) => sum + l.totalEncaisse, 0)) : 0;
  const totalInscrits =
    Array.isArray(lignes) ? lignes.reduce((sum, l) => sum + l.nbInscrits, 0) : 0;
  const meilleurType = Array.isArray(lignes) && lignes.length > 0 ? lignes[0] : null;

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Total encaissé" value={fmtMontant(totalEncaisse)} />
          <KpiCard label="Apprenants payants" value={String(totalInscrits)} />
          <KpiCard
            label="Type de cours le plus rentable"
            value={meilleurType ? meilleurType.typeCours : "—"}
            sub={meilleurType ? fmtMontant(meilleurType.totalEncaisse) : undefined}
          />
          <KpiCard
            label="Encaissements enregistrés"
            value={Array.isArray(historique) ? String(historique.length) : "—"}
          />
        </div>
      </Reveal>

      <Reveal delay={20}>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <h3 className="font-display text-base font-semibold text-white">
            Encaissements par type de cours
          </h3>
          <p className="mt-1 font-mono text-[11px] text-white/40">
            Trié du type de cours le plus rentable au moins rentable.
          </p>

          {lignes === "loading" && <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>}
          {lignes === "erreur" && (
            <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>
          )}
          {Array.isArray(lignes) && lignes.length === 0 && (
            <p className="mt-4 font-sans text-sm text-white/50">
              Aucun type de cours renseigné sur les vagues actuelles.
            </p>
          )}
          {Array.isArray(lignes) && lignes.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-widest text-white/40">
                    <th className="py-2 pr-3">Type de cours</th>
                    <th className="py-2 pr-3">Nb d&apos;inscrits</th>
                    <th className="py-2 pr-3">Total encaissé</th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.map((l, i) => (
                    <tr
                      key={l.typeCours}
                      className={`border-b border-white/5 font-sans text-sm text-white/80 ${
                        i === 0 ? "bg-accent/5" : ""
                      }`}
                    >
                      <td className="py-2.5 pr-3 text-white">
                        {l.typeCours}
                        {i === 0 && (
                          <span className="ml-2 rounded-full border border-accent/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
                            Top
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-xs">{l.nbInscrits}</td>
                      <td className="py-2.5 pr-3 font-mono text-xs text-accent">
                        {fmtMontant(l.totalEncaisse)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Reveal>

      <Reveal delay={30}>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded border border-white/10 bg-obsidianCard p-6">
            <h3 className="font-display text-base font-semibold text-white">
              Comparatif hebdomadaire
            </h3>
            <TendanceTable lignes={hebdo} labelFn={(l) => fmtSemaine(l.semaine!)} />
          </div>
          <div className="rounded border border-white/10 bg-obsidianCard p-6">
            <h3 className="font-display text-base font-semibold text-white">
              Comparatif mensuel
            </h3>
            <TendanceTable lignes={mensuel} labelFn={(l) => fmtPeriode(l.periode!)} />
          </div>
        </div>
      </Reveal>

      <Reveal delay={40}>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-white">
              Historique des encaissements
            </h3>
            <button
              onClick={() => setOpen((o) => !o)}
              className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
            >
              {open ? "Fermer" : "+ Enregistrer un encaissement"}
            </button>
          </div>

          {open && (
            <div className="mt-4 rounded border border-white/10 bg-obsidian p-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                    Apprenant
                  </label>
                  <select
                    value={form.apprenantId}
                    onChange={(e) => setForm((f) => ({ ...f, apprenantId: e.target.value }))}
                    className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
                  >
                    <option value="">— Choisir —</option>
                    {apprenants.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nomComplet} ({a.typeCours})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                    Montant
                  </label>
                  <input
                    type="number"
                    value={form.montant}
                    onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))}
                    placeholder="Ex. 500000"
                    className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                    Jour
                  </label>
                  <input
                    type="date"
                    value={form.jour}
                    onChange={(e) => setForm((f) => ({ ...f, jour: e.target.value }))}
                    className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                    Moyen de paiement
                  </label>
                  <select
                    value={form.moyenPaiement}
                    onChange={(e) => setForm((f) => ({ ...f, moyenPaiement: e.target.value }))}
                    className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
                  >
                    <option value="">—</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Virement bancaire">Virement bancaire</option>
                    <option value="Espèces">Espèces</option>
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <Button
                  variant="dark"
                  onClick={createEncaissement}
                  disabled={status === "saving" || !form.apprenantId || !form.montant || !form.jour}
                >
                  {status === "saving" ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
              {status === "error" && (
                <p className="mt-2 font-mono text-xs text-accent">Erreur — vérifiez les champs.</p>
              )}
            </div>
          )}

          {historique === "loading" && (
            <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>
          )}
          {historique === "erreur" && (
            <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>
          )}
          {Array.isArray(historique) && historique.length === 0 && (
            <p className="mt-4 font-sans text-sm text-white/50">Aucun encaissement pour l&apos;instant.</p>
          )}
          {Array.isArray(historique) && historique.length > 0 && (
            <div className="mt-4 space-y-2">
              {historique.map((e) => (
                <div
                  key={e.id}
                  className="rounded border border-white/10 bg-obsidian px-4 py-3"
                >
                  {editingId === e.id ? (
                    <div>
                      <div className="grid gap-3 sm:grid-cols-4">
                        <div>
                          <label className="block font-mono text-[10px] uppercase tracking-widest text-white/50">
                            Apprenant
                          </label>
                          <select
                            value={editForm.apprenantId}
                            onChange={(ev) =>
                              setEditForm((f) => ({ ...f, apprenantId: ev.target.value }))
                            }
                            className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-2 py-1.5 font-sans text-sm text-white outline-none focus:border-accent"
                          >
                            {apprenants.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.nomComplet} ({a.typeCours})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block font-mono text-[10px] uppercase tracking-widest text-white/50">
                            Montant
                          </label>
                          <input
                            type="number"
                            value={editForm.montant}
                            onChange={(ev) => setEditForm((f) => ({ ...f, montant: ev.target.value }))}
                            className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-2 py-1.5 font-mono text-sm text-white outline-none focus:border-accent"
                          />
                        </div>
                        <div>
                          <label className="block font-mono text-[10px] uppercase tracking-widest text-white/50">
                            Jour
                          </label>
                          <input
                            type="date"
                            value={editForm.jour}
                            onChange={(ev) => setEditForm((f) => ({ ...f, jour: ev.target.value }))}
                            className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-2 py-1.5 font-sans text-sm text-white outline-none focus:border-accent"
                          />
                        </div>
                        <div>
                          <label className="block font-mono text-[10px] uppercase tracking-widest text-white/50">
                            Moyen de paiement
                          </label>
                          <select
                            value={editForm.moyenPaiement}
                            onChange={(ev) =>
                              setEditForm((f) => ({ ...f, moyenPaiement: ev.target.value }))
                            }
                            className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-2 py-1.5 font-sans text-sm text-white outline-none focus:border-accent"
                          >
                            <option value="">—</option>
                            <option value="Mobile Money">Mobile Money</option>
                            <option value="Virement bancaire">Virement bancaire</option>
                            <option value="Espèces">Espèces</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          onClick={() => saveEdit(e.id)}
                          disabled={editStatus === "saving"}
                          className="font-mono text-[11px] uppercase tracking-widest text-accent hover:underline disabled:opacity-50"
                        >
                          {editStatus === "saving" ? "Enregistrement..." : "Enregistrer"}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="font-mono text-[11px] uppercase tracking-widest text-white/40 hover:underline"
                        >
                          Annuler
                        </button>
                        {editStatus === "error" && (
                          <span className="font-mono text-[11px] text-accent">Erreur — vérifiez les champs.</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-sans text-sm text-white">
                          {e.apprenantNom} — {e.typeCours ?? "—"}
                        </p>
                        <p className="font-mono text-[11px] text-white/40">
                          {fmtJour(e.jour)}
                          {e.moyenPaiement && ` · ${e.moyenPaiement}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => startEdit(e)}
                          className="font-mono text-sm text-accent hover:underline"
                          title="Modifier l'encaissement"
                        >
                          {fmtMontant(e.montant)}
                        </button>
                        <button
                          onClick={() => removeEncaissement(e)}
                          disabled={deletingId === e.id}
                          className="font-mono text-[11px] uppercase tracking-widest text-white/40 hover:text-accent disabled:opacity-50"
                          title="Supprimer l'encaissement"
                        >
                          {deletingId === e.id ? "..." : "Supprimer"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function TendanceTable({
  lignes,
  labelFn,
}: {
  lignes: LigneTendance[] | "loading" | "erreur";
  labelFn: (l: LigneTendance) => string;
}) {
  if (lignes === "loading") return <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>;
  if (lignes === "erreur")
    return <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>;
  if (lignes.length === 0)
    return (
      <p className="mt-4 font-sans text-xs text-white/50">Pas encore d&apos;encaissement enregistré.</p>
    );

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[240px] border-collapse text-left">
        <tbody>
          {[...lignes].reverse().map((l) => (
            <tr key={labelFn(l)} className="border-b border-white/5 font-sans text-sm text-white/80">
              <td className="py-2 pr-3 text-white">{labelFn(l)}</td>
              <td className="py-2 pr-3 font-mono text-xs text-accent">{fmtMontant(l.totalEncaisse)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
