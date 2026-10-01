import { isAudio, isImage, isOfficeDocument, isPdf, isVideo } from "./file-signature";

describe("file-signature", () => {
  it("isPdf reconnaît un vrai PDF et rejette un fichier renommé", () => {
    expect(isPdf(Buffer.from("%PDF-1.7\n..."))).toBe(true);
    expect(isPdf(Buffer.from("MZ\x90\x00")) /* en-tête .exe */).toBe(false);
    expect(isPdf(Buffer.from("juste du texte"))).toBe(false);
  });

  it("isImage reconnaît PNG, JPEG et WEBP", () => {
    expect(isImage(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]))).toBe(true);
    expect(isImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(true);
    expect(isImage(Buffer.concat([Buffer.from("RIFF????"), Buffer.from("WEBP")]))).toBe(true);
    expect(isImage(Buffer.from("<script>alert(1)</script>"))).toBe(false);
  });

  it("isOfficeDocument accepte PDF, ZIP (docx/pptx) et OLE (doc/ppt legacy) mais pas un exécutable", () => {
    expect(isOfficeDocument(Buffer.from("%PDF-1.4"))).toBe(true);
    expect(isOfficeDocument(Buffer.from([0x50, 0x4b, 0x03, 0x04]))).toBe(true);
    expect(isOfficeDocument(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))).toBe(true);
    expect(isOfficeDocument(Buffer.from([0x4d, 0x5a]))).toBe(false);
  });

  it("isVideo reconnaît webm et mp4/mov (ftyp à l'offset 4)", () => {
    expect(isVideo(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))).toBe(true);
    expect(isVideo(Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from("ftypmp42")]))).toBe(true);
    expect(isVideo(Buffer.from("pas une vidéo"))).toBe(false);
  });

  it("isAudio reconnaît webm/m4a/ogg/wav/mp3 mais pas un binaire arbitraire", () => {
    expect(isAudio(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))).toBe(true);
    expect(isAudio(Buffer.from("OggS...."))).toBe(true);
    expect(isAudio(Buffer.concat([Buffer.from("RIFF????"), Buffer.from("WAVE")]))).toBe(true);
    expect(isAudio(Buffer.from("ID3\x03\x00"))).toBe(true);
    expect(isAudio(Buffer.from([0x4d, 0x5a, 0x90, 0x00]))).toBe(false);
  });

  it("ne plante pas sur un buffer plus court que la signature", () => {
    expect(isPdf(Buffer.from([0x25]))).toBe(false);
    expect(isPdf(Buffer.alloc(0))).toBe(false);
  });
});
