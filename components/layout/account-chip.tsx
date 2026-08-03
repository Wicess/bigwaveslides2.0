"use client";

import * as React from "react";
import { User } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * The navbar account button. Reads the readable `bws_name` cookie (set at
 * sign-in) to decide whether to show a signed-in profile avatar (the first
 * initial in a wave-gradient circle) or the generic account icon — with zero
 * DB read or dynamic render, so it costs nothing on every page load.
 *
 * It renders the neutral icon on the server and first client paint (cookies
 * aren't readable during SSR), then upgrades to the avatar after mount, so
 * there's never a hydration mismatch.
 */
export function AccountChip({ label }: { label: string }) {
  const [name, setName] = React.useState<string | null>(null);

  React.useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)bws_name=([^;]*)/);
    if (m) setName(decodeURIComponent(m[1] ?? ""));
  }, []);

  const signedIn = name !== null;
  const initial = (name ?? "").trim().charAt(0).toUpperCase();

  return (
    <Link
      href="/account"
      aria-label={label}
      className={cn(
        "grid size-9 place-items-center rounded-md border text-white transition-colors sm:size-11",
        signedIn
          ? "border-white/25 bg-white/10 hover:bg-white/15"
          : "border-white/15 bg-white/5 hover:bg-white/10",
      )}
    >
      {signedIn ? (
        <span className="font-brand grid size-7 place-items-center rounded-full text-[13px] font-bold text-white [background:var(--gradient-wave)] sm:size-8 sm:text-sm">
          {initial || <User className="size-4" />}
        </span>
      ) : (
        <User className="size-4 sm:size-[18px]" />
      )}
    </Link>
  );
}
