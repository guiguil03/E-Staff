// Intégration Cal.com (module de calendrier requis au Bouton 1 et Bouton 2
// du cahier des charges). Les liens réels (NEXT_PUBLIC_CAL_LINK_*) doivent
// être remplacés une fois le compte Cal.com de la cliente créé — voir .env.
//
// Tant que le compte Cal.com n'existe pas, ces liens pointent vers un
// événement inexistant : Cal.com renvoie sa propre page 404 (thème
// blanc/noir Cal.com) à l'intérieur de l'iframe, ce qui casse radicalement
// l'univers visuel obsidian du site. Le placeholder ci-dessous est affiché
// à la place tant que le lien correspond à un des slugs par défaut de .env.example.
const PLACEHOLDER_LINKS = new Set([
  "e-staf/cadrage-commercial",
  "e-staf/cadrage-connecteur",
]);

// Permet aux écrans appelants d'adapter le texte/CTA autour du calendrier
// (ex. "Réservez votre créneau" n'a pas de sens tant que le calendrier
// n'est pas configuré).
export function isCalendarConfigured(link: string) {
  return !PLACEHOLDER_LINKS.has(link);
}

interface CalendarEmbedProps {
  link: string;
  title: string;
  className?: string;
}

export default function CalendarEmbed({
  link,
  title,
  className = "",
}: CalendarEmbedProps) {
  if (PLACEHOLDER_LINKS.has(link)) {
    return (
      <div
        className={`flex h-[320px] flex-col items-center justify-center gap-2 rounded border border-dashed border-accent/30 bg-obsidianCard px-6 text-center ${className}`.trim()}
      >
        <p className="font-display text-base font-semibold text-white">
          Calendrier bientôt disponible
        </p>
        <p className="max-w-sm font-sans text-sm text-white/60">
          La prise de rendez-vous en ligne arrive prochainement. En
          attendant, l&apos;équipe e-Staf vous recontactera directement par
          e-mail ou téléphone pour fixer votre créneau.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded border border-white/10 bg-obsidianCard ${className}`.trim()}
    >
      <iframe
        src={`https://cal.com/${link}?embed=true&theme=dark`}
        title={title}
        className="h-[700px] w-full"
        frameBorder={0}
      />
    </div>
  );
}
