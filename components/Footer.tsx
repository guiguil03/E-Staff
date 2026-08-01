import Image from "next/image";
import Link from "next/link";

const LEGAL_LINKS = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Confidentialité", href: "/confidentialite" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-primary/10 bg-primary text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/logo.png"
            alt="e-Staf"
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover"
          />
          <span className="font-display text-base font-semibold">e-Staf</span>
        </div>

        <nav aria-label="Liens légaux">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 font-sans text-sm text-white/70">
            {LEGAL_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-accent">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="font-mono text-xs text-white/50">
          © {year} e-Staf. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
