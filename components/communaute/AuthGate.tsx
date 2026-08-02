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
export default function AuthGate({ message, className = "" }: AuthGateProps) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded border border-dashed border-primary/30 bg-primary/5 px-6 py-8 text-center ${className}`.trim()}
    >
      <LockIcon className="h-6 w-6 text-primary/60" />
      <p className="max-w-sm font-sans text-sm text-primary">{message}</p>
      <Link
        href="/connexion"
        className="inline-flex items-center justify-center rounded border border-primary bg-primary px-5 py-2 font-sans text-sm font-medium text-white transition-colors duration-150 hover:bg-primary/90"
      >
        Se connecter
      </Link>
    </div>
  );
}
