// Bandeau affiché en tête des pages légales tant que le texte réel
// (immatriculation, hébergeur, politique de conservation...) n'a pas été
// fourni par la cliente — évite qu'un texte à moitié inventé passe pour du
// contenu final. Les champs concernés sont eux-mêmes marqués « à compléter »
// dans le corps de chaque page.
export default function PlaceholderNotice() {
  return (
    <div className="rounded border border-dashed border-accent/40 bg-accent/5 px-4 py-3 sm:px-5 sm:py-4">
      <p className="font-mono text-[11px] uppercase tracking-widest text-accent">
        Page en attente de contenu
      </p>
      <p className="mt-1.5 font-sans text-sm leading-relaxed text-white/70">
        Les passages marqués <span className="text-white">« à compléter »</span> ne sont pas
        encore rédigés — cette page existe pour que le lien fonctionne, pas comme texte définitif.
      </p>
    </div>
  );
}
