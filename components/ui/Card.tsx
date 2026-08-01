import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

// Simple bordered white card — generic container for the light universe.
export default function Card({ children, className = "", ...rest }: CardProps) {
  return (
    <div
      className={`rounded border border-primary/10 bg-white p-6 ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}
