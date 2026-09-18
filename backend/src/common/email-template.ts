// Habillage HTML partagé pour tous les e-mails transactionnels — reprend la
// palette "light universe" du site public (voir tailwind.config.ts) et le
// vrai logo (public/brand/logo.png, servi par le frontend) pour que les
// mails soient reconnaissables comme e-Staf plutôt que du texte brut
// générique. Mise en page en table (compatibilité Outlook/clients mail
// historiques), styles inline (beaucoup de webmails strippent les <style>),
// polices web en best-effort avec repli sur des polices système — le mail
// reste lisible et sur-marque même quand elles ne chargent pas.
//
// EmailService envoie toujours `text` en parallèle de `html` (Resend accepte
// les deux) : `text` reste la source de vérité fonctionnelle (contenu
// complet, jamais de logique uniquement dans le HTML), `html` n'est que
// l'habillage visuel.

const COLORS = {
  background: "#F4F3EF",
  cardBg: "#FFFFFF",
  ink: "#14161A",
  primary: "#0F1E37",
  accent: "#B8973E",
  border: "#E7E3D9",
  muted: "#807A6E",
} as const;

const FONT_DISPLAY = "'Fraunces', Georgia, 'Times New Roman', serif";
const FONT_SANS =
  "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const FONT_MONO =
  "'IBM Plex Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace";

const LOGO_URL = `${process.env.FRONTEND_URL ?? "https://e-staff.vercel.app"}/brand/logo.png`;

export interface EmailTemplateOptions {
  /** Titre affiché en tête du mail (H1 stylé display) — distinct du sujet. */
  title: string;
  /** Corps du message, en HTML déjà formé (paragraphes <p>, etc.) — voir
   * les helpers ci-dessous (emailParagraph, credentialsBox, ctaButton) pour
   * générer des blocs cohérents avec le reste du template. */
  bodyHtml: string;
  /** Texte court invisible affiché en aperçu par la plupart des clients
   * mail dans la liste des messages, avant l'ouverture. */
  preheader?: string;
}

export function renderEmailHtml({ title, bodyHtml, preheader }: EmailTemplateOptions): string {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <!--[if mso]>
    <style>
      * { font-family: Georgia, 'Times New Roman', serif !important; }
    </style>
    <![endif]-->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
  </head>
  <body
    style="margin:0;padding:0;background-color:${COLORS.background};-webkit-text-size-adjust:100%;"
  >
    ${
      preheader
        ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(
            preheader
          )}</div>`
        : ""
    }
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.background};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <img
                  src="${LOGO_URL}"
                  alt="e-Staf"
                  width="48"
                  height="48"
                  style="display:block;width:48px;height:48px;"
                />
              </td>
            </tr>
            <tr>
              <td style="background-color:${COLORS.cardBg};border:1px solid ${COLORS.border};border-radius:8px;padding:32px;">
                <h1 style="margin:0 0 20px;font-family:${FONT_DISPLAY};font-weight:700;font-size:22px;line-height:1.3;color:${COLORS.primary};">
                  ${escapeHtml(title)}
                </h1>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding-top:24px;text-align:center;">
                <span style="font-family:${FONT_MONO};font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:${COLORS.muted};">
                  L'équipe e-Staf
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Paragraphe de corps de texte standard — mêmes styles à chaque appel. Le
 * `html` passé n'est PAS échappé (pour pouvoir y glisser un <a>/<strong>) —
 * ne jamais y passer de texte utilisateur brut sans l'échapper avant. */
export function emailParagraph(html: string): string {
  return `<p style="margin:0 0 16px;font-family:${FONT_SANS};font-size:15px;line-height:1.6;color:${COLORS.ink};">${html}</p>`;
}

/** Convertit un message texte libre (déjà utilisé tel quel par ailleurs,
 * ex. le même contenu envoyé par WhatsApp) en paragraphes HTML — un
 * paragraphe par double saut de ligne, <br> pour les sauts simples à
 * l'intérieur. Échappe le texte (contenu potentiellement composé à partir
 * de champs utilisateur). */
export function emailParagraphsFromText(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => emailParagraph(escapeHtml(block).replace(/\n/g, "<br />")))
    .join("");
}

/** Bloc identifiants (matricule + mot de passe) mis en évidence — utilisé
 * par tous les mails de création/régénération de compte. */
export function credentialsBox(rows: { label: string; value: string }[]): string {
  const cells = rows
    .map(
      (r) => `
        <tr>
          <td style="padding:4px 0;font-family:${FONT_SANS};font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:${COLORS.muted};">${escapeHtml(r.label)}</td>
        </tr>
        <tr>
          <td style="padding:0 0 12px;font-family:${FONT_MONO};font-size:17px;color:${COLORS.primary};">${escapeHtml(r.value)}</td>
        </tr>`
    )
    .join("");
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.background};border:1px solid ${COLORS.border};border-radius:6px;padding:16px 20px;margin:0 0 20px;">
      ${cells}
    </table>`;
}

/** Citation mise en avant (ex. commentaire du formateur) — texte échappé. */
export function emailQuote(text: string): string {
  return `<blockquote style="margin:0 0 20px;padding:12px 16px;border-left:3px solid ${COLORS.accent};background-color:${COLORS.background};font-family:${FONT_SANS};font-style:italic;font-size:15px;line-height:1.6;color:${COLORS.ink};">${escapeHtml(text)}</blockquote>`;
}

/** Bouton d'action principal (lien de réinitialisation, rejoindre la classe
 * virtuelle, consulter le contrat...). */
export function ctaButton(label: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
      <tr>
        <td style="border-radius:6px;background-color:${COLORS.accent};">
          <a
            href="${escapeAttr(url)}"
            style="display:inline-block;padding:12px 24px;font-family:${FONT_SANS};font-weight:600;font-size:14px;color:${COLORS.primary};text-decoration:none;border-radius:6px;"
          >${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`;
}

/** Échappe du texte utilisateur avant de l'insérer dans un bloc HTML fait à
 * la main (ex. une citation) — emailParagraph/credentialsBox/ctaButton
 * échappent déjà ce qu'ils reçoivent en tant que valeur simple, celle-ci
 * sert pour le HTML composé directement dans un service. */
export function escapeEmailHtml(value: string): string {
  return escapeHtml(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}
