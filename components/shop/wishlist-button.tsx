"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useWishlist } from "@/lib/use-wishlist";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

export function WishlistButton({
  slug,
  name,
  variant = "icon",
  className,
}: {
  slug: string;
  name?: string;
  /** `icon` = floating circle on cards; `full` = labelled button on detail page. */
  variant?: "icon" | "full";
  className?: string;
}) {
  const t = useTranslations("Shop");
  const { has, toggle, ready } = useWishlist();
  const active = has(slug);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggle(slug);
    toast.success(added ? t("wishlistAdded") : t("wishlistRemoved"));
  };

  const label = active ? t("wishlistRemove") : t("wishlistAdd");

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={cn(
          "inline-flex h-13 items-center justify-center gap-2 rounded-full border px-6 text-base font-semibold transition-all active:scale-[0.98]",
          active
            ? "border-primary bg-primary-50 text-primary"
            : "border-border text-foreground hover:border-primary hover:text-primary",
          className,
        )}
      >
        <Heart className={cn("size-5", active && "fill-current")} aria-hidden />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={name ? `${label}: ${name}` : label}
      aria-pressed={active}
      className={cn(
        "grid size-9 place-items-center rounded-full bg-background/80 text-foreground shadow-[var(--shadow-soft)] backdrop-blur transition-all hover:scale-110 hover:text-primary",
        !ready && "opacity-0",
        className,
      )}
    >
      <Heart
        className={cn("size-4.5", active && "fill-red-500 text-red-500")}
        aria-hidden
      />
    </button>
  );
}
