"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { eachDate } from "@/lib/rental-pricing";
import { cn } from "@/lib/utils";

export type DateRange = { start: string | null; end: string | null };

function todayISO(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    .toISOString()
    .slice(0, 10);
}

function ymd(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

export function AvailabilityCalendar({
  productId,
  value,
  onChange,
}: {
  productId: string;
  value: DateRange;
  onChange: (range: DateRange) => void;
}) {
  const t = useTranslations("Availability");
  const locale = useLocale();
  const today = todayISO();

  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const initial = value.start ? new Date(`${value.start}T00:00:00Z`) : new Date();
  const [view, setView] = useState({
    year: initial.getUTCFullYear(),
    month: initial.getUTCMonth(),
  });

  // Load blocked dates for a forward window once.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/availability?productId=${productId}&days=240`)
      .then((r) => r.json())
      .then((data: { blockedDates?: string[] }) => {
        if (!cancelled) setBlocked(new Set(data.blockedDates ?? []));
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(Date.UTC(view.year, view.month, 1))),
    [view, locale],
  );

  const weekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
      weekday: "short",
      timeZone: "UTC",
    });
    // Week starting Sunday.
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(new Date(Date.UTC(2024, 0, 7 + i))),
    );
  }, [locale]);

  const firstWeekday = new Date(Date.UTC(view.year, view.month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();

  const rangeHasBlocked = (start: string, end: string) =>
    eachDate(start, end).some((d) => blocked.has(d));

  const inRange = (iso: string) =>
    value.start && value.end && iso >= value.start && iso <= value.end;

  const pick = (iso: string) => {
    if (iso < today || blocked.has(iso)) return;
    // Fresh start, or restart after a complete range.
    if (!value.start || (value.start && value.end)) {
      onChange({ start: iso, end: null });
      return;
    }
    // Second click.
    if (iso < value.start) {
      onChange({ start: iso, end: null });
    } else if (iso === value.start) {
      onChange({ start: iso, end: iso });
    } else if (rangeHasBlocked(value.start, iso)) {
      onChange({ start: iso, end: null }); // would cross a booked day → restart
    } else {
      onChange({ start: value.start, end: iso });
    }
  };

  const canGoBack =
    new Date(Date.UTC(view.year, view.month, 1)).getTime() >
    new Date(`${today.slice(0, 7)}-01T00:00:00Z`).getTime();

  const shiftMonth = (delta: number) => {
    setView((v) => {
      const d = new Date(Date.UTC(v.year, v.month + delta, 1));
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
    });
  };

  return (
    <div className="rounded-[var(--radius-lg)] border border-border p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          disabled={!canGoBack}
          aria-label={t("prevMonth")}
          className="grid size-9 place-items-center rounded-full hover:bg-muted disabled:opacity-30"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="font-semibold capitalize">
          {monthLabel}
          {loading ? (
            <Loader2 className="ml-2 inline size-3.5 animate-spin text-muted-foreground" />
          ) : null}
        </span>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label={t("nextMonth")}
          className="grid size-9 place-items-center rounded-full hover:bg-muted"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {weekdays.map((w) => (
          <span key={w} className="py-1">
            {w}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const iso = ymd(view.year, view.month, day);
          const isPast = iso < today;
          const isBlocked = blocked.has(iso);
          const disabled = isPast || isBlocked;
          const isStart = iso === value.start;
          const isEnd = iso === value.end;
          const selected = isStart || isEnd;
          const within = inRange(iso) && !selected;
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => pick(iso)}
              aria-label={iso}
              aria-pressed={selected}
              className={cn(
                "relative grid h-10 place-items-center rounded-lg text-sm transition-colors",
                disabled && "cursor-not-allowed text-muted-foreground/40 line-through",
                !disabled && !selected && !within && "hover:bg-muted",
                within && "bg-primary-50 text-primary",
                selected && "bg-primary font-semibold text-white",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-primary" /> {t("legendSelected")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-primary-50" /> {t("legendRange")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-muted line-through" /> {t("legendBooked")}
        </span>
      </div>
    </div>
  );
}
