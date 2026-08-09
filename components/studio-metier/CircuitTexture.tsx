// Very subtle circuit-board-pattern background texture, unique to the
// Studio Métier dark/elite page. No precedent component exists yet in this
// codebase (checked for a PageBits-style helper — none found), so this is a
// small self-contained inline-SVG data-URI tile, kept deliberately low
// opacity so it never competes with foreground content.
export default function CircuitTexture() {
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'>" +
    "<g fill='none' stroke='%23B8973E' stroke-width='1'>" +
    "<path d='M0 24h24v24h24M72 0v24h24M0 72h24V48M72 96V72h24'/>" +
    "</g>" +
    "<g fill='%23B8973E'>" +
    "<circle cx='24' cy='48' r='1.6'/>" +
    "<circle cx='72' cy='24' r='1.6'/>" +
    "<circle cx='48' cy='72' r='1.6'/>" +
    "</g>" +
    "</svg>";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-[0.05]"
      style={{
        backgroundImage: `url("data:image/svg+xml,${svg}")`,
        backgroundSize: "96px 96px",
      }}
    />
  );
}
