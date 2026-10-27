import type { DailyService } from "../classe-virtuelle/daily.service";

// Ouverture d'une salle de visio Daily persistante (salle de brief d'une
// mission, réunion de superviseur) : créée à la première ouverture,
// réutilisée ensuite, avec un jeton nominatif par participant.
// `configured: false` tant que DAILY_API_KEY n'est pas posée — le front
// l'affiche honnêtement au lieu de planter.
export async function ouvrirSalleVisio(
  daily: DailyService,
  salle: {
    roomId: string; // nom de la salle à créer, ex. "brief-<missionId>"
    roomName: string | null;
    roomUrl: string | null;
    dureeValiditeSecondes: number;
    persister: (roomName: string, roomUrl: string) => Promise<unknown>;
  },
  participant: { userId: string; userName: string; owner: boolean }
): Promise<{ configured: boolean; url: string | null }> {
  let { roomName, roomUrl } = salle;
  if (!roomName || !roomUrl) {
    const nouvelle = await daily.createRoom(
      salle.roomId,
      Math.floor(Date.now() / 1000) + salle.dureeValiditeSecondes
    );
    if (!nouvelle.configured || !nouvelle.roomName || !nouvelle.roomUrl) {
      return { configured: nouvelle.configured, url: null };
    }
    roomName = nouvelle.roomName;
    roomUrl = nouvelle.roomUrl;
    await salle.persister(roomName, roomUrl);
  }
  const token = await daily.mintMeetingToken({
    roomName,
    userId: participant.userId,
    userName: participant.userName,
    isOwner: participant.owner,
  });
  return { configured: true, url: token ? `${roomUrl}?t=${token}` : roomUrl };
}
