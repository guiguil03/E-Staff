"use client";

import { useState } from "react";
import { ShareIcon } from "./CommunityIcons";

interface ShareButtonProps {
  label: string;
  /** Appelé une fois par partage effectif (après la copie du lien) — utilisé
   * pour incrémenter un vrai compteur partagé côté serveur (MediaWall).
   * Omis par défaut : bouton purement cosmétique (témoignages). */
  onShare?: () => void;
}

// Copies the current page URL to the clipboard as a lightweight "share"
// affordance — no real sharing target, just a courteous confirmation flip
// on the button label. See `onShare` for persisting a real share count.
export default function ShareButton({ label, onShare }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    try {
      if (typeof window !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {
      // Clipboard API unavailable — fail silently, the label still flips so
      // the click doesn't feel like a no-op.
    }
    setCopied(true);
    onShare?.();
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={label}
      className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-obsidian/60 px-3 py-1.5 font-sans text-xs font-medium text-white/70 transition-colors duration-150 hover:border-accent hover:text-accent"
    >
      <ShareIcon className="h-4 w-4" />
      <span>{copied ? "Lien copié" : "Partager"}</span>
    </button>
  );
}
