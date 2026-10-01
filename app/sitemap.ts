import type { MetadataRoute } from "next";

const BASE_URL = "https://e-staf.com";

// Pages marketing publiques uniquement — le reste (compte/**, connexion,
// contrats/évaluations liés à un id personnel) est privé ou sans valeur
// SEO propre, voir robots.ts pour le disallow correspondant.
const ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/offres/examens", priority: 0.8, changeFrequency: "monthly" },
  { path: "/offres/fol", priority: 0.8, changeFrequency: "monthly" },
  { path: "/offres/carrieres", priority: 0.8, changeFrequency: "monthly" },
  { path: "/evaluation", priority: 0.8, changeFrequency: "monthly" },
  { path: "/entreprises", priority: 0.7, changeFrequency: "monthly" },
  { path: "/entreprises/proposer-un-projet", priority: 0.6, changeFrequency: "monthly" },
  { path: "/entreprises/former-son-equipe", priority: 0.6, changeFrequency: "monthly" },
  { path: "/entreprises/devenir-connecteur", priority: 0.6, changeFrequency: "monthly" },
  { path: "/forum", priority: 0.6, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/mentions-legales", priority: 0.2, changeFrequency: "yearly" },
  { path: "/confidentialite", priority: 0.2, changeFrequency: "yearly" },
  { path: "/conditions-generales", priority: 0.2, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
