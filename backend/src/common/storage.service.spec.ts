import { typeServable } from "./storage.service";

describe("typeServable (fichiers déposés servis par l'API)", () => {
  it("garde les types de documents et médias attendus", () => {
    for (const t of ["application/pdf", "image/png", "audio/webm", "video/mp4", "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]) {
      expect(typeServable(t)).toBe(t);
    }
  });

  it("sert en téléchargement tout type qu'un navigateur afficherait comme une page", () => {
    for (const t of ["text/html", "image/svg+xml", "application/xhtml+xml", "text/html; charset=utf-8", undefined]) {
      expect(typeServable(t)).toBe("application/octet-stream");
    }
  });
});
