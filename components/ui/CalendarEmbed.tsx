// Intégration Cal.com (module de calendrier requis au Bouton 1 et Bouton 2
// du cahier des charges). Les liens réels (NEXT_PUBLIC_CAL_LINK_*) doivent
// être remplacés une fois le compte Cal.com de la cliente créé — voir .env.
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
