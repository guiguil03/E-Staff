// Posts "Photos & vidéos de l'équipe" (/offres/carrieres) — renvoyés par GET /media-posts
// (backend/src/media-wall). Publiés directement par la RH, sans file de
// modération.
export interface MediaPostPublic {
  id: string;
  type: "photo" | "video";
  caption: string | null;
  auteur: string | null;
  createdAt: string;
  likes: number;
  shares: number;
}
