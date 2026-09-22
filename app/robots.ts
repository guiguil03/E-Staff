import type { MetadataRoute } from "next";

const BASE_URL = "https://e-staf.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Tableaux de bord privés, flux d'authentification et pages liées à
      // un id personnel (contrat, évaluation, inscription) — aucune valeur
      // SEO, et certaines exposent des données personnelles à qui devine/
      // trouve le lien : pas la peine de les faire indexer/suivre.
      disallow: [
        "/compte",
        "/connexion",
        "/creer-un-compte",
        "/mot-de-passe-oublie",
        "/reinitialiser-mot-de-passe",
        "/evaluation/contrat",
        "/evaluation/formateur",
        "/inscription",
        "/forum/live",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
