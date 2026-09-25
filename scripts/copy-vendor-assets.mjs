// Copie dans public/ les fichiers que le navigateur charge à la demande,
// pour les servir depuis le site plutôt qu'un CDN :
//
// 1. pdf.js : le worker qui lit les PDF importés sur le tableau blanc
//    (voir pdfEnImages dans TableauBlanc.tsx).
//
// 2. Les fichiers annexes d'Excalidraw (polices, code chargé à la
//    demande, traductions), au lieu du CDN unpkg qu'Excalidraw utilise par
//    défaut (tableau blanc de la classe virtuelle).
//
// Lancé automatiquement après `npm install` (postinstall) ; les dossiers
// copiés ne sont pas versionnés (voir .gitignore).
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const workerPdf = join("node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.min.mjs");
if (existsSync(workerPdf)) {
  mkdirSync(join("public", "pdfjs"), { recursive: true });
  cpSync(workerPdf, join("public", "pdfjs", "pdf.worker.min.mjs"));
  console.log("[pdfjs] worker copié dans public/pdfjs/");
} else {
  console.warn("[pdfjs] paquet absent, copie du worker ignorée");
}

const source = join("node_modules", "@excalidraw", "excalidraw", "dist");
if (existsSync(source)) {
  for (const dossier of ["excalidraw-assets", "excalidraw-assets-dev"]) {
    cpSync(join(source, dossier), join("public", dossier), { recursive: true });
  }
  console.log("[excalidraw] assets copiés dans public/");
} else {
  console.warn("[excalidraw] paquet absent, copie des assets ignorée");
}
