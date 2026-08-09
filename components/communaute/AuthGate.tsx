import Link from "next/link";
import { LockIcon } from "./CommunityIcons";

interface AuthGateProps {
  /** Explains what the visitor cannot do while logged out. */
  message: string;
  className?: string;
}

// Reusable "logged-out" notice: this project has no real accounts backend
// yet, so account-gated actions (commenting, posting a testimonial,
// uploading media) are represented honestly as disabled/gated rather than
// as a working form that silently succeeds for anonymous visitors.
// Styled for the dark/elite (obsidian) universe.
export default function AuthGate({ message, className = "" }: AuthGateProps) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded border border-dashed border-accent/40 bg-obsidian/60 px-6 py-8 text-center ${className}`.trim()}
    >
      <LockIcon className="h-6 w-6 text-accent" />
      <p className="max-w-sm font-sans text-sm text-white/80">{message}</p>
      <Link
        href="/connexion"
        className="inline-flex items-center justify-center rounded-full border border-accent bg-accent px-5 py-2 font-sans text-sm font-medium text-obsidian transition-colors duration-150 hover:bg-accent/90"
      >
        Se connecter
      </Link>
    </div>
  );
}
