"use client";

import { useState } from "react";
import Link from "next/link";

export interface CalendarEvent {
  id: string;
  date: Date;
  label: string;
  href: string;
}

interface CalendarMonthViewProps {
  events: CalendarEvent[];
}

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTH_LABEL = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Vue calendrier mensuelle faite main (pas de dépendance externe), même
// esprit que les autres visualisations du projet (SVG radar/gauge). Utilisée
// pour le calendrier de classes virtuelles côté formateur et apprenant —
// affiche les séances planifiées (Seance.startAt), navigation mois par mois.
export default function CalendarMonthView({ events }: CalendarMonthViewProps) {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const firstOfMonth = viewMonth;
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth() + 1, 0).getDate();
  const today = new Date();

  const cells: (Date | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          className="rounded border border-white/15 px-2 py-1 font-mono text-xs text-white/60 hover:border-accent/50 hover:text-accent"
          aria-label="Mois précédent"
        >
          ←
        </button>
        <p className="font-display text-sm font-semibold capitalize text-white">
          {MONTH_LABEL.format(firstOfMonth)}
        </p>
        <button
          onClick={() => setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          className="rounded border border-white/15 px-2 py-1 font-mono text-xs text-white/60 hover:border-accent/50 hover:text-accent"
          aria-label="Mois suivant"
        >
          →
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center font-mono text-[10px] uppercase tracking-widest text-white/30">
            {w}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const dayEvents = events.filter((e) => sameDay(e.date, date));
          const isToday = sameDay(date, today);
          return (
            <div
              key={i}
              className={`min-h-[64px] rounded border p-1 text-left ${
                isToday ? "border-accent/50 bg-accent/5" : "border-white/10 bg-obsidian"
              }`}
            >
              <span className="font-mono text-[10px] text-white/40">{date.getDate()}</span>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 2).map((e) => (
                  <Link
                    key={e.id}
                    href={e.href}
                    className="block truncate rounded bg-accent/15 px-1 py-0.5 font-sans text-[10px] text-accent hover:bg-accent/25"
                  >
                    {e.label}
                  </Link>
                ))}
                {dayEvents.length > 2 && (
                  <p className="font-mono text-[9px] text-white/40">+{dayEvents.length - 2}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
