// Copie les fichiers annexes d'Excalidraw (polices, code chargé à la
// demande, traductions) dans public/ pour les servir depuis le site, au
// lieu du CDN unpkg qu'Excalidraw utilise par défaut (tableau blanc de la
// classe virtuelle, voir components/classe-virtuelle/TableauBlanc.tsx).
// Lancé automatiquement après `npm install` (postinstall) ; les dossiers
// copiés ne sont pas versionnés (voir .gitignore).
import { cpSync, existsSync } from "node:fs";
import { join } from "node:path";

const source = join("node_modules", "@excalidraw", "excalidraw", "dist");
if (!existsSync(source)) {
  console.warn("[excalidraw] paquet absent, copie des assets ignorée");
  process.exit(0);
}
for (const dossier of ["excalidraw-assets", "excalidraw-assets-dev"]) {
  cpSync(join(source, dossier), join("public", dossier), { recursive: true });
}
console.log("[excalidraw] assets copiés dans public/");
