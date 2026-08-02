"use client";

import { useState } from "react";
import { ShareIcon } from "./CommunityIcons";

interface ShareButtonProps {
  label: string;
}

// Copies the current page URL to the clipboard as a lightweight "share"
// affordance — no backend, no real sharing target, just a courteous
// confirmation flip on the button label.
export default function ShareButton({ label }: ShareButtonProps) {
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
