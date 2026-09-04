import { notFound } from "next/navigation";

// Masqué le temps de préparer du contenu à mettre dessus (2026-09-05) — le
// composant StudioMetier reste en place, prêt à être réactivé en retirant
// ce notFound() et en restaurant le rendu ci-dessous.
export default function CarrieresPage() {
  notFound();
}
