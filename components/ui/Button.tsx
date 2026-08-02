import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "accent" | "ghost" | "dark" | "teal" | "ghostDark";

const VARIANT_CLASSES: Record<Variant, string> = {
  // Light universe — solid navy.
  primary:
    "bg-primary text-white hover:bg-primary/90 border border-primary",
  // Light or dark universe — solid gold.
  accent:
    "bg-accent text-primary hover:bg-accent/90 border border-accent",
  // Light universe — outlined navy.
  ghost:
    "bg-transparent text-primary border border-primary hover:bg-primary hover:text-white",
  // Dark/elite universe (obsidian pages) — solid gold on navy text, high contrast.
  dark:
    "bg-accent text-obsidian hover:bg-accent/90 border border-accent",
  // Light universe — solid teal, the "Entreprises"-side accent (used for
  // the examens page's primary CTA, matching the client's reference).
  teal:
    "bg-teal text-white hover:bg-teal/90 border border-teal",
  // Dark/elite universe — outlined gold, secondary action on obsidian pages
  // (the dark-universe counterpart to `ghost`).
  ghostDark:
    "bg-transparent text-accent border border-accent hover:bg-accent hover:text-obsidian",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded px-6 py-3 font-sans text-sm font-medium tracking-wide transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50";

interface CommonProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

interface ButtonAsLink extends CommonProps {
  href: string;
  onClick?: never;
  type?: never;
  disabled?: boolean;
  linkProps?: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className">;
}

interface ButtonAsButton extends CommonProps {
  href?: never;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  buttonProps?: Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "onClick" | "type" | "className" | "disabled"
  >;
}

type ButtonProps = ButtonAsLink | ButtonAsButton;

export default function Button(props: ButtonProps) {
  const { variant = "primary", children, className = "" } = props;
  const classes = `${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`.trim();

  if ("href" in props && props.href) {
    if (props.disabled) {
      return (
        <span aria-disabled="true" className={classes}>
          {children}
        </span>
      );
    }
    return (
      <Link href={props.href} className={classes} {...props.linkProps}>
        {children}
      </Link>
    );
  }

  const { onClick, type = "button", disabled, buttonProps } = props as ButtonAsButton;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
