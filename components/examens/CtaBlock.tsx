import Button from "@/components/ui/Button";

// Bottom framed CTA — dark/elite obsidian panel, matching the FOL / Studio
// Métier convention. Routes to the full /evaluation test flow (5-block
// architecture screen, coordonnées, épreuves) rather than a standalone
// contact form — client's instruction, 2026-08-04: this button is meant to
// be the entry point into the real test, not a lighter separate funnel.
export default function CtaBlock() {
  return (
    <div className="rounded border border-accent/25 bg-obsidianCard p-8 text-center sm:p-12">
      <h2 className="font-display text-2xl font-bold text-accent sm:text-3xl">
        Prêt à transformer votre potentiel en réussite officielle ?
      </h2>
      <p className="mx-auto mt-4 max-w-2xl font-sans text-sm text-white/70 sm:text-base">
        Pour garantir un accompagnement sur-mesure et orienter votre
        préparation vers le programme d&apos;excellence qui vous correspond,
        la première étape commence ici.
      </p>

      <div className="mt-6 flex justify-center">
        <Button variant="dark" href="/evaluation" className="rounded-full px-8">
          Passer mon test de niveau initial →
        </Button>
      </div>
    </div>
  );
}
