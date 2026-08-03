import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

/**
 * Visible breadcrumb trail — orientation + one-tap "up" navigation, a key way
 * to move people off a deep landing page (city/product/blog) into the rest of
 * the site. The last item is the current page (not a link).
 */
export function Breadcrumbs({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex min-w-0 items-center gap-1.5">
              {it.href && !last ? (
                <Link
                  href={it.href}
                  className="hover:text-primary max-w-[16rem] truncate transition-colors"
                >
                  {it.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className={cn(
                    "max-w-[16rem] truncate",
                    last && "text-foreground font-medium",
                  )}
                >
                  {it.label}
                </span>
              )}
              {!last ? (
                <ChevronRight className="text-muted-foreground/50 size-3.5 shrink-0" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
