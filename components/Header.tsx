import Image from "next/image";
import Link from "next/link";

const NAV_ITEMS = [
  { label: "Communauté", href: "/communaute" },
  { label: "Forum", href: "/forum" },
  { label: "Se préparer aux examens", href: "/offres/examens" },
  { label: "Proposer un partenariat", href: "/entreprises" },
  { label: "Se connecter", href: "/connexion" },
];

export default function Header() {
  return (
    <header className="border-b border-primary/10 bg-background">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/brand/logo.png"
            alt="e-Staf"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
            priority
          />
          <span className="font-display text-lg font-semibold text-primary">
            e-Staf
          </span>
        </Link>

        <nav aria-label="Navigation principale">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 font-sans text-sm text-primary">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-accent">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
