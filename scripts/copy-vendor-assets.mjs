// Copie dans public/ les fichiers que le navigateur charge à la demande,
// pour les servir depuis le site plutôt qu'un CDN :
//
// 1. pdf.js : le worker qui lit les PDF importés sur le tableau blanc
//    (voir pdfEnImages dans TableauBlanc.tsx).
//
// 2. Les polices d'Excalidraw, au lieu du CDN qu'Excalidraw utilise par
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

// Excalidraw 0.18 : seules les polices sont chargées à la demande (le code
// est intégré au bundle) — servies depuis /excalidraw/fonts/, voir
// EXCALIDRAW_ASSET_PATH dans TableauBlanc.tsx.
const source = join("node_modules", "@excalidraw", "excalidraw", "dist", "prod", "fonts");
if (existsSync(source)) {
  cpSync(source, join("public", "excalidraw", "fonts"), { recursive: true });
  console.log("[excalidraw] polices copiées dans public/excalidraw/");
} else {
  console.warn("[excalidraw] paquet absent, copie des polices ignorée");
}
