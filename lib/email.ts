// Envoi d'e-mail — stub en attendant les identifiants d'un fournisseur réel
// (Resend, SMTP...). En dev/local, on se contente de logger le contenu.
// Câbler un vrai provider ici quand la cliente fournit les accès.
export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
}) {
  if (!process.env.EMAIL_PROVIDER_API_KEY) {
    console.log(
      `[email:stub] à=${params.to} sujet="${params.subject}"\n${params.text}`
    );
    return { delivered: false, reason: "no-provider-configured" as const };
  }

  // TODO: brancher le vrai provider (ex. Resend) une fois la clé fournie.
  console.log(`[email:stub] provider configuré mais non implémenté`);
  return { delivered: false, reason: "provider-not-implemented" as const };
}
