"use client";

import { useState } from "react";
import { Calendar, ArrowRight } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function DateWidget({ label, cta }: { label: string; cta: string }) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="glass w-full max-w-md rounded-[var(--radius-lg)] p-2 shadow-[var(--shadow-soft)]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.push(date ? `/rent?date=${date}` : "/rent");
        }}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <label className="flex flex-1 items-center gap-2 rounded-[var(--radius-sm)] bg-background/70 px-3 py-2.5">
          <Calendar className="size-4 shrink-0 text-primary" />
          <span className="sr-only">{label}</span>
          <input
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label={label}
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        <Button type="submit" variant="gradient" className="shrink-0">
          {cta}
          <ArrowRight className="size-4" />
        </Button>
      </form>
    </div>
  );
}
