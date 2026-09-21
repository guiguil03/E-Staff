// Vérifie le contenu RÉEL d'un fichier par ses premiers octets ("magic
// bytes") plutôt que par le Content-Type déclaré par le client — c'est tout
// ce que `fileFilter` de Multer peut vérifier (il s'exécute avant que le
// fichier soit bufferisé), et un Content-Type se falsifie aussi facilement
// qu'un en-tête HTTP. Volontairement en dur, sans librairie de parsing
// (type `file-type`, qui a son propre historique de CVE de déni de
// service sur des conteneurs malformés) : une comparaison d'octets n'a
// aucune surface d'attaque par désérialisation.
//
// Objectif : bloquer un exécutable/script renommé avec une extension de
// confiance (ex. `virus.exe` envoyé comme "cv.pdf"). Ça ne remplace pas un
// vrai scan antivirus (contenu malveillant à l'intérieur d'un PDF/Office
// légitime) — voir l'audit du 2026-09-21 pour la discussion ClamAV/API
// cloud, qui demande soit un changement d'infra soit un compte externe.

function startsWith(buffer: Buffer, signature: Buffer, offset = 0): boolean {
  if (buffer.length < offset + signature.length) return false;
  return buffer.subarray(offset, offset + signature.length).equals(signature);
}

const PDF = Buffer.from("%PDF-");
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff]);
const RIFF = Buffer.from("RIFF");
const WEBP_TAG = Buffer.from("WEBP");
const WAVE_TAG = Buffer.from("WAVE");
const ZIP = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // .docx/.pptx/.xlsx (OOXML, format ZIP)
const OLE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]); // .doc/.ppt legacy (OLE Compound File)
const WEBM = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]); // .webm (vidéo ou audio-only)
const FTYP = Buffer.from("ftyp"); // .mp4/.mov/.m4a, à l'offset 4
const OGG = Buffer.from("OggS");
const MP3_ID3 = Buffer.from("ID3");

export function isPdf(buffer: Buffer): boolean {
  return startsWith(buffer, PDF);
}

export function isImage(buffer: Buffer): boolean {
  if (startsWith(buffer, PNG)) return true;
  if (startsWith(buffer, JPEG)) return true;
  if (startsWith(buffer, RIFF) && startsWith(buffer, WEBP_TAG, 8)) return true;
  return false;
}

// PDF, ZIP (.docx/.pptx OOXML) ou OLE Compound File (.doc/.ppt legacy,
// pré-2007) — les trois familles de format effectivement acceptées par les
// fiches de préparation formateur et le contrat formateur (voir
// ALLOWED_DOCUMENT_MIMETYPES / ALLOWED_CONTRAT_MIMETYPES).
export function isOfficeDocument(buffer: Buffer): boolean {
  return isPdf(buffer) || startsWith(buffer, ZIP) || startsWith(buffer, OLE);
}

export function isVideo(buffer: Buffer): boolean {
  if (startsWith(buffer, WEBM)) return true;
  if (startsWith(buffer, FTYP, 4)) return true;
  return false;
}

export function isAudio(buffer: Buffer): boolean {
  if (startsWith(buffer, WEBM)) return true; // .webm audio-only — même conteneur
  if (startsWith(buffer, FTYP, 4)) return true; // .m4a partage l'entête .mp4
  if (startsWith(buffer, OGG)) return true;
  if (startsWith(buffer, RIFF) && startsWith(buffer, WAVE_TAG, 8)) return true;
  if (startsWith(buffer, MP3_ID3)) return true;
  return false;
}
