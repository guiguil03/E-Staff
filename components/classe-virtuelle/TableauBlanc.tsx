"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, apiGetBlob, ApiError } from "@/lib/api";

// Polices et code annexe d'Excalidraw servis par le site lui-même (copiés
// dans public/ par scripts/copy-excalidraw-assets.mjs) plutôt que depuis le
// CDN unpkg par défaut. Doit être défini avant le chargement d'Excalidraw.
if (typeof window !== "undefined") {
  (window as unknown as { EXCALIDRAW_ASSET_PATH: string }).EXCALIDRAW_ASSET_PATH = "/";
}

// Excalidraw ne fonctionne que côté navigateur (canvas) : jamais rendu au
// serveur.
const Excalidraw = dynamic(async () => (await import("@excalidraw/excalidraw")).Excalidraw, {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center font-sans text-sm text-white/50">
      Chargement du tableau...
    </div>
  ),
});

// Types minimaux de l'API impérative d'Excalidraw utilisés ici.
interface FichierTableau {
  id: string;
  dataURL: string;
  mimeType: string;
  created: number;
}
interface ExcalidrawApi {
  updateScene: (scene: { elements: readonly unknown[] }) => void;
  getSceneElements: () => readonly unknown[];
  getFiles: () => Record<string, FichierTableau>;
  addFiles: (files: FichierTableau[]) => void;
  scrollToContent: (
    target?: unknown,
    opts?: { fitToViewport?: boolean; viewportZoomFactor?: number; animate?: boolean }
  ) => void;
  refresh: () => void;
}

interface TableauApi {
  version: number;
  inchange?: true;
  elements?: unknown[];
  fichiers?: { fileId: string; mimeType: string }[];
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/+$/, "");
const SAUVEGARDE_MS = 800;
const RAFRAICHISSEMENT_MS = 2000;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(dataURL: string): Promise<Blob> {
  return (await fetch(dataURL)).blob();
}

// Tableau blanc partagé d'une classe virtuelle (demande cliente du
// 2026-09-25 : le formateur annote pendant le cours). Deux modes :
// - "edition" (formateur) : dessin, texte, formes, images à annoter ;
//   la scène est sauvegardée automatiquement (PUT, en fichier JSON), les
//   images envoyées une fois sur le bucket ;
// - "lecture" (apprenant) : lecture seule, rafraîchie toutes les 2 s, et
//   seulement quand la version a changé côté serveur.
export default function TableauBlanc({
  mode,
  basePath,
  headers,
  onNouveaute,
  visible = true,
}: {
  mode: "edition" | "lecture";
  /** Route du tableau : /seances/A/8/tableau ou /apprenants/X/seances/8/tableau */
  basePath: string;
  headers?: HeadersInit;
  /** Lecture : appelé quand le formateur a modifié le tableau. */
  onNouveaute?: () => void;
  /** Faux quand le tableau est monté dans un onglet masqué. */
  visible?: boolean;
}) {
  const [api, setApi] = useState<ExcalidrawApi | null>(null);
  const [etat, setEtat] = useState<"chargement" | "pret" | "enregistrement" | "erreur">("chargement");
  const version = useRef<number | null>(null);
  const fichiersConnus = useRef<Set<string>>(new Set());
  const chargementInitial = useRef(true);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);
  const derniereScene = useRef<string>("");

  // Récupère les images référencées qu'on n'a pas encore.
  const chargerFichiers = useCallback(
    async (excalidraw: ExcalidrawApi, fichiers: { fileId: string; mimeType: string }[]) => {
      const manquants = fichiers.filter((f) => !fichiersConnus.current.has(f.fileId));
      const charges = await Promise.all(
        manquants.map(async (f) => {
          try {
            const blob = await apiGetBlob(`${basePath}/fichiers/${f.fileId}`, headers ?? {});
            fichiersConnus.current.add(f.fileId);
            return { id: f.fileId, dataURL: await blobToDataUrl(blob), mimeType: f.mimeType, created: Date.now() };
          } catch {
            return null;
          }
        })
      );
      const valides = charges.filter((c): c is FichierTableau => c !== null);
      if (valides.length) excalidraw.addFiles(valides);
    },
    [basePath, headers]
  );

  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const cadrer = useCallback((excalidraw: ExcalidrawApi) => {
    // Un tableau dans un onglet masqué a une taille nulle : on attend qu'il
    // soit affiché (voir l'effet sur `visible`).
    if (!visibleRef.current) return;
    if (excalidraw.getSceneElements().length === 0) return;
    excalidraw.scrollToContent(undefined, { fitToViewport: true, viewportZoomFactor: 0.9 });
  }, []);

  // Onglet rendu visible : recalcule la taille du canevas puis recadre.
  useEffect(() => {
    if (!api || !visible) return;
    // refresh() fait relire la taille du conteneur à Excalidraw ; le
    // cadrage doit attendre que cette nouvelle taille soit appliquée.
    let timeoutId: ReturnType<typeof setTimeout>;
    const id = requestAnimationFrame(() => {
      api.refresh();
      timeoutId = setTimeout(() => cadrer(api), 200);
    });
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(timeoutId);
    };
  }, [api, visible, cadrer]);

  // Chargement initial + (lecture) rafraîchissement.
  useEffect(() => {
    if (!api) return;
    let annule = false;
    let minuteur: ReturnType<typeof setTimeout>;

    async function charger() {
      try {
        const depuis = mode === "lecture" && version.current !== null ? `?depuis=${version.current}` : "";
        const data = await apiGet<TableauApi>(`${basePath}${depuis}`, headers);
        if (annule || !api) return;
        if (!data.inchange) {
          await chargerFichiers(api, data.fichiers ?? []);
          derniereScene.current = JSON.stringify(data.elements ?? []);
          api.updateScene({ elements: data.elements ?? [] });
          if (version.current !== null) onNouveaute?.();
          // Formateur : cadrage une fois au chargement. Apprenant : recadré
          // à chaque mise à jour pour toujours voir tout ce que montre le
          // formateur.
          if (version.current === null || mode === "lecture") setTimeout(() => cadrer(api), 50);
          version.current = data.version;
        }
        setEtat("pret");
      } catch (err) {
        if (!annule) setEtat(err instanceof ApiError && err.status === 401 ? "erreur" : "pret");
      } finally {
        chargementInitial.current = false;
      }
      if (!annule && mode === "lecture") minuteur = setTimeout(charger, RAFRAICHISSEMENT_MS);
    }
    charger();
    return () => {
      annule = true;
      clearTimeout(minuteur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, basePath, mode]);

  // Édition : envoie les nouvelles images, puis la scène (debounce).
  const sauvegarder = useCallback(async () => {
    if (!api) return;
    setEtat("enregistrement");
    try {
      const fichiers = api.getFiles();
      for (const [id, fichier] of Object.entries(fichiers)) {
        if (fichiersConnus.current.has(id)) continue;
        const form = new FormData();
        form.append("fichier", await dataUrlToBlob(fichier.dataURL), id);
        const res = await fetch(`${API_URL}${basePath}/fichiers/${id}`, {
          method: "POST",
          credentials: "include",
          headers,
          body: form,
        });
        if (res.ok) fichiersConnus.current.add(id);
      }
      const scene = JSON.stringify(api.getSceneElements());
      const form = new FormData();
      form.append("scene", new Blob([scene], { type: "application/json" }), "scene.json");
      const res = await fetch(`${API_URL}${basePath}`, {
        method: "PUT",
        credentials: "include",
        headers,
        body: form,
      });
      if (!res.ok) throw new Error(String(res.status));
      derniereScene.current = scene;
      setEtat("pret");
    } catch {
      setEtat("erreur");
    }
  }, [api, basePath, headers]);

  // Changement d'onglet / fermeture juste après un tracé : la sauvegarde en
  // attente part tout de suite au lieu d'être perdue.
  const sauvegarderRef = useRef(sauvegarder);
  sauvegarderRef.current = sauvegarder;
  useEffect(
    () => () => {
      if (minuterie.current) {
        clearTimeout(minuterie.current);
        void sauvegarderRef.current();
      }
    },
    []
  );

  const onChange = useCallback(
    (elements: readonly unknown[]) => {
      if (mode !== "edition" || chargementInitial.current) return;
      // onChange se déclenche aussi pour un simple déplacement de la vue :
      // on ne sauvegarde que si la scène a vraiment changé.
      if (JSON.stringify(elements) === derniereScene.current) return;
      if (minuterie.current) clearTimeout(minuterie.current);
      minuterie.current = setTimeout(sauvegarder, SAUVEGARDE_MS);
    },
    [mode, sauvegarder]
  );

  return (
    <div className="flex h-full min-h-[320px] flex-col">
      {mode === "edition" && (
        <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-white/40">
          {etat === "chargement"
            ? "Chargement..."
            : etat === "enregistrement"
              ? "Enregistrement..."
              : etat === "erreur"
                ? "Échec de l'enregistrement — continuez, nouvel essai à la prochaine modification"
                : "Visible en direct par les apprenants · images : glisser-déposer"}
        </p>
      )}
      <div className="min-h-0 flex-1 overflow-hidden rounded border border-white/10 bg-white">
        <Excalidraw
          excalidrawAPI={(a: unknown) => setApi(a as ExcalidrawApi)}
          onChange={(elements: readonly unknown[]) => onChange(elements)}
          viewModeEnabled={mode === "lecture"}
          zenModeEnabled={mode === "lecture"}
          langCode="fr-FR"
          UIOptions={{ canvasActions: { loadScene: false, saveToActiveFile: false, export: false } }}
        />
      </div>
    </div>
  );
}
