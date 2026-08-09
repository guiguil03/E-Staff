// Persistent "condition d'accès" + reassurance callouts. Shown once, before
// the job grid, rather than re-shown per métier selection (avoids
// duplicating the same note ten times across the page).
export default function AccessNotice() {
  return (
    <div className="space-y-4">
      <div className="rounded border-l-4 border-accent bg-obsidianCard px-5 py-4 sm:px-6 sm:py-5">
        <p className="font-sans text-sm leading-relaxed text-white/85 sm:text-base">
          L&apos;accès à nos missions et à nos grands comptes est réservé aux
          talents validant le niveau C1 après notre test de sélection.
        </p>
        <p className="mt-2 font-sans text-sm leading-relaxed text-white/85 sm:text-base">
          Passez le test, faites votre inscription, et nous, on se chargera
          de vous fournir votre courbe de progression en temps réel.
        </p>
      </div>

      <div className="rounded border-l-4 border-accent/50 bg-obsidianCard/70 px-5 py-4 sm:px-6 sm:py-5">
        <p className="font-sans text-sm leading-relaxed text-white/70 sm:text-base">
          N&apos;ayez aucune crainte : chez e-Staf, nous valorisons
          l&apos;humain avant tout. Si vous craignez d&apos;échouer au test,
          nous sommes là pour vous rattraper, vous former et vous hisser vers
          l&apos;excellence — votre potentiel mérite qu&apos;on
          l&apos;accompagne.
        </p>
      </div>
    </div>
  );
}
