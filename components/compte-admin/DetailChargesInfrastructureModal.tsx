"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { apiGet, apiGetBlob, apiPostAuthed, apiPut, apiUpload } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface ChargeInfrastructure {
  id: string;
  poste: string;
  motif: string | null;
  prestataire: string | null;
  periode: string;
  montantTheorique: number;
  montantReel: number;
  pieceJustificativeKey: string | null;
  pieceJustificativeNom: string | null;
  modePaiement: string | null;
  statut: string;
  datePaiement: string | null;
}

function fmtMontant(n: number): string {
  return `${n.toLocaleString("fr-FR")} Ar`;
}

const emptyForm = { poste: "", motif: "", prestataire: "", montantTheorique: "" };

// Vision micro derrière le poste "Charges Fixes Infrastructure" — factures
// réelles (loyer, connexion, électricité, logistique...) avec pièce
// justificative déposée dans le même bucket S3 que les enregistrements
// d'évaluation (voir StorageService). Contrairement aux autres postes,
// aucune formule automatique ici : ce sont de vraies dépenses saisies par
// la RH. Rendu via portail (même raison que ClientMissionModal).
export default function DetailChargesInfrastructureModal({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<ChargeInfrastructure[] | "loading" | "erreur">("loading");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [payingTout, setPayingTout] = useState(false);

  function refresh() {
    apiGet<ChargeInfrastructure[]>("/production/charges-infrastructure", adminHeaders())
      .then(setData)
      .catch(() => setData("erreur"));
  }

  useEffect(refresh, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const periode = Array.isArray(data) && data.length > 0 ? data[0].periode : null;

  async function create() {
    if (!form.poste.trim() || !form.montantTheorique || !periode) return;
    setCreating(true);
    try {
      await apiPostAuthed(
        "/production/charges-infrastructure",
        {
          poste: form.poste.trim(),
          motif: form.motif.trim() || undefined,
          prestataire: form.prestataire.trim() || undefined,
          periode,
          montantTheorique: Number(form.montantTheorique),
        },
        adminHeaders()
      );
      setForm(emptyForm);
      setOpen(false);
      refresh();
    } finally {
      setCreating(false);
    }
  }

  async function payerTout() {
    if (!periode || !Array.isArray(data)) return;
    const enAttente = data.filter((c) => c.statut !== "paye");
    const totalAPayer = enAttente.reduce((sum, c) => sum + c.montantReel, 0);
    if (
      !window.confirm(
        `Marquer les ${enAttente.length} charge(s) en attente comme payées pour un total de ${fmtMontant(totalAPayer)} ? Cette action est irréversible.`
      )
    )
      return;
    setPayingTout(true);
    try {
      await apiPostAuthed(
        `/production/charges-infrastructure/payer-tout?periode=${periode}`,
        {},
        adminHeaders()
      );
      refresh();
    } finally {
      setPayingTout(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded border border-white/10 bg-obsidianCard p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <p className="font-display text-lg font-semibold text-white">
              Détail — charges fixes infrastructure
            </p>
            <p className="mt-1 font-mono text-[11px] text-white/40">
              Loyer, connexion internet, électricité, logistique... avec pièce justificative.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded border border-white/15 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-white/50 hover:border-white/30 hover:text-white"
          >
            Fermer
          </button>
        </div>

        {data === "loading" && (
          <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>
        )}
        {data === "erreur" && (
          <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>
        )}

        {Array.isArray(data) && (
          <>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => setOpen((o) => !o)}
                className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
              >
                {open ? "Fermer" : "+ Ajouter une ligne"}
              </button>
              <button
                onClick={payerTout}
                disabled={payingTout || data.every((c) => c.statut === "paye")}
                className="rounded border border-success/40 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-success hover:bg-success/10 disabled:opacity-50"
              >
                {payingTout ? "..." : "Payer tout"}
              </button>
            </div>

            {open && (
              <div className="mt-3 rounded border border-white/10 bg-obsidian p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                      Poste
                    </label>
                    <input
                      value={form.poste}
                      onChange={(e) => setForm((f) => ({ ...f, poste: e.target.value }))}
                      placeholder="Ex. Assurance locaux"
                      className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                      Montant théorique
                    </label>
                    <input
                      type="number"
                      value={form.montantTheorique}
                      onChange={(e) => setForm((f) => ({ ...f, montantTheorique: e.target.value }))}
                      className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                      Prestataire
                    </label>
                    <input
                      value={form.prestataire}
                      onChange={(e) => setForm((f) => ({ ...f, prestataire: e.target.value }))}
                      className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                      Motif
                    </label>
                    <input
                      value={form.motif}
                      onChange={(e) => setForm((f) => ({ ...f, motif: e.target.value }))}
                      className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
                    />
                  </div>
                </div>
                <button
                  onClick={create}
                  disabled={creating || !form.poste.trim() || !form.montantTheorique}
                  className="mt-3 rounded border border-accent px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-accent hover:bg-accent/10 disabled:opacity-50"
                >
                  {creating ? "Création..." : "Ajouter"}
                </button>
              </div>
            )}

            {data.length === 0 ? (
              <p className="mt-4 font-sans text-sm text-white/50">Aucune charge pour l&apos;instant.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-widest text-white/40">
                      <th className="py-2 pr-3">Poste</th>
                      <th className="py-2 pr-3">Prestataire</th>
                      <th className="py-2 pr-3">Théorique</th>
                      <th className="py-2 pr-3">Réel</th>
                      <th className="py-2 pr-3">Pièce justificative</th>
                      <th className="py-2 pr-3">Mode</th>
                      <th className="py-2 pr-3">Statut</th>
                      <th className="py-2 pr-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((c) => (
                      <ChargeRow key={c.id} charge={c} onSaved={refresh} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

function ChargeRow({ charge, onSaved }: { charge: ChargeInfrastructure; onSaved: () => void }) {
  const [montantTheorique, setMontantTheorique] = useState(String(charge.montantTheorique));
  const [montantReel, setMontantReel] = useState(String(charge.montantReel));
  const [modePaiement, setModePaiement] = useState(charge.modePaiement ?? "");
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [uploading, setUploading] = useState(false);

  const paye = charge.statut === "paye";

  async function save() {
    setSaving(true);
    try {
      await apiPut(
        `/production/charges-infrastructure/${charge.id}`,
        {
          poste: charge.poste,
          motif: charge.motif ?? undefined,
          prestataire: charge.prestataire ?? undefined,
          periode: charge.periode,
          montantTheorique: Number(montantTheorique) || 0,
          montantReel: Number(montantReel) || 0,
          modePaiement: modePaiement || null,
        },
        adminHeaders()
      );
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function payer() {
    if (
      !window.confirm(
        `Marquer la charge "${charge.poste}" (${fmtMontant(Number(montantReel) || 0)}) comme payée ? Cette action est irréversible.`
      )
    )
      return;
    setPaying(true);
    try {
      await apiPostAuthed(`/production/charges-infrastructure/${charge.id}/payer`, {}, adminHeaders());
      onSaved();
    } finally {
      setPaying(false);
    }
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("fichier", file);
      await apiUpload(
        `/production/charges-infrastructure/${charge.id}/piece-justificative`,
        formData,
        adminHeaders()
      );
      onSaved();
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function download() {
    const blob = await apiGetBlob(
      `/production/charges-infrastructure/${charge.id}/piece-justificative`,
      adminHeaders()
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <tr className="border-b border-white/5 align-top font-sans text-xs text-white/80">
      <td className="py-2 pr-3">
        <span className="block text-white">{charge.poste}</span>
        {charge.motif && <span className="block font-mono text-[10px] text-white/40">{charge.motif}</span>}
      </td>
      <td className="py-2 pr-3">{charge.prestataire ?? "—"}</td>
      <td className="py-2 pr-3">
        <input
          type="number"
          value={montantTheorique}
          onChange={(e) => setMontantTheorique(e.target.value)}
          onBlur={save}
          disabled={saving || paye}
          className="w-24 rounded border border-white/20 bg-obsidian px-2 py-1 font-mono text-xs text-white outline-none focus:border-accent disabled:opacity-60"
        />
      </td>
      <td className="py-2 pr-3">
        <input
          type="number"
          value={montantReel}
          onChange={(e) => setMontantReel(e.target.value)}
          onBlur={save}
          disabled={saving || paye}
          className="w-24 rounded border border-white/20 bg-obsidian px-2 py-1 font-mono text-xs text-white outline-none focus:border-accent disabled:opacity-60"
        />
      </td>
      <td className="py-2 pr-3">
        {charge.pieceJustificativeKey ? (
          <button
            onClick={download}
            className="font-mono text-[11px] text-accent hover:underline"
            title={charge.pieceJustificativeNom ?? undefined}
          >
            {charge.pieceJustificativeNom ?? "Voir la pièce"}
          </button>
        ) : (
          <label className="cursor-pointer font-mono text-[10px] uppercase tracking-widest text-white/40 hover:text-accent">
            {uploading ? "Envoi..." : "Déposer pièce"}
            <input type="file" onChange={uploadFile} disabled={uploading} className="hidden" />
          </label>
        )}
      </td>
      <td className="py-2 pr-3">
        <select
          value={modePaiement}
          onChange={(e) => setModePaiement(e.target.value)}
          onBlur={save}
          disabled={saving || paye}
          className="rounded border border-white/20 bg-obsidian px-2 py-1 text-xs text-white outline-none focus:border-accent disabled:opacity-60"
        >
          <option value="">—</option>
          <option value="Virement">Virement</option>
          <option value="MVola">MVola</option>
          <option value="Orange Money">Orange Money</option>
          <option value="Airtel Money">Airtel Money</option>
          <option value="Espèces">Espèces</option>
        </select>
      </td>
      <td className="py-2 pr-3">
        <span
          className={`rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-widest ${
            paye ? "border-success/40 text-success" : "border-accent/40 text-accent"
          }`}
        >
          {paye ? "Payé" : "En attente"}
        </span>
      </td>
      <td className="py-2 pr-3">
        {!paye && (
          <button
            onClick={payer}
            disabled={paying}
            className="rounded border border-accent px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-accent hover:bg-accent/10 disabled:opacity-50"
          >
            {paying ? "..." : `Payer (${fmtMontant(Number(montantReel) || 0)})`}
          </button>
        )}
      </td>
    </tr>
  );
}
