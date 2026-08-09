// Shared dark-universe form field styling for the Contact & Partenariats
// flows (Bouton 1 and Bouton 2). Both flows live exclusively on the obsidian
// background, unlike RegistrationForm which supports a light tone too.
export const labelClass = "block text-sm font-medium mb-1 text-white/80";

export const inputClass =
  "w-full rounded border border-white/20 bg-obsidian px-4 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-accent";

export const selectClass = inputClass;

export const textareaClass = `${inputClass} min-h-[100px] resize-y`;

export const fieldsetClass =
  "rounded border border-white/10 bg-obsidianCard p-6";

export const legendClass =
  "mb-4 font-display text-lg font-semibold text-white";
